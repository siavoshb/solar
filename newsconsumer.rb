#!/usr/bin/env ruby

require 'rubygems'
require 'hiredis'
require 'redis'
require 'json'
require 'uri'

NewsAgePadding = 3600*8
TopNewsPerPage = 30
LatestNewsPerPage = 100
NewsEditTime = 60*15
NewsScoreLogStart = 10
NewsScoreLogBooster = 2
RankAgingFactor = 1.1
PreventRepostTime = 3600*1600
NewsSubmissionBreak = 60*15
SavedNewsPerPage = 10
TopNewsAgeLimit = 3600*24*30

RedisURL = "redis://127.0.0.1:6379"

#def increment_user_karma_by(user_id,increment)
#    userkey = "user:#{user_id}"
#    $r.hincrby(userkey,"karma",increment)
#    if $user and ($user['id'].to_i == user_id.to_i)
#        $user['karma'] = $user['karma'].to_i + increment
#    end
#end

def compute_news_rank(news)
    age = (Time.now.to_i - news["ctime"].to_i)
    rank = ((news["score"].to_f)*1000000)/((age+NewsAgePadding)**RankAgingFactor)
    rank = -age if (age > TopNewsAgeLimit)
    return rank
end

def compute_news_score(news)
    upvotes = $r.zrange("news.up:#{news["id"]}",0,-1,:withscores => true)
    downvotes = $r.zrange("news.down:#{news["id"]}",0,-1,:withscores => true)
    # FIXME: For now we are doing a naive sum of votes, without time-based
    # filtering, nor IP filtering.
    # We could use just ZCARD here of course, but I'm using ZRANGE already
    # since this is what is needed in the long term for vote analysis.
    score = upvotes.length-downvotes.length
    # Now let's add the logarithm of the sum of all the votes, since
    # something with 5 up and 5 down is less interesting than something
    # with 50 up and 50 donw.
    votes = upvotes.length/2+downvotes.length/2
    if votes > NewsScoreLogStart
        score += Math.log(votes-NewsScoreLogStart)*NewsScoreLogBooster
    end
    score
end

def get_user_karma(user_id)
    return $user['karma'].to_i if $user and (user_id.to_i == $user['id'].to_i)
    userkey = "user:#{user_id}"
    karma = $r.hget(userkey,"karma")
    karma ? karma.to_i : 0
end

def get_user_by_id(id)
    $r.hgetall("user:#{id}")
end

def get_news_by_id(news_ids,opt={})
    result = []
    if !news_ids.is_a? Array
        opt[:single] = true
        news_ids = [news_ids]
    end
    news = $r.pipelined {
        news_ids.each{|nid|
            $r.hgetall("news:#{nid}")
        }
    }
    return [] if !news # Can happen only if news_ids is an empty array.

    # Remove empty elements
    news = news.select{|x| x.length > 0}
    if news.length == 0
        return opt[:single] ? nil : []
    end

    # Get all the news
    $r.pipelined {
        news.each{|n|
            # Adjust rank if too different from the real-time value.
            update_news_rank_if_needed(n) if opt[:update_rank]
            result << n
        }
    }

    # Get the associated users information
    usernames = $r.pipelined {
        result.each{|n|
            $r.hget("user:#{n["user_id"]}","username")
        }
    }
    result.each_with_index{|n,i|
        n["username"] = usernames[i]
    }

    # Load $User vote information if we are in the context of a
    # registered user.
    if $user
        votes = $r.pipelined {
            result.each{|n|
                $r.zscore("news.up:#{n["id"]}",$user["id"])
                $r.zscore("news.down:#{n["id"]}",$user["id"])
            }
        }
        result.each_with_index{|n,i|
            if votes[i*2]
                n["voted"] = :up
            elsif votes[(i*2)+1]
                n["voted"] = :down
            end
        }
    end

    # Return an array if we got an array as input, otherwise
    # the single element the caller requested.
    opt[:single] ? result[0] : result
end

def vote_news(news_id,user_id,vote_type)
    # Fetch news and user
    #user = ($user and $user["id"] == user_id) ? $user : get_user_by_id(user_id)
    news = get_news_by_id(news_id)
    #return false,"No such news or user." if !news or !user

    # Now it's time to check if the user already voted that news, either
    # up or down. If so return now.
    #if $r.zscore("news.up:#{news_id}",user_id) or
    #   $r.zscore("news.down:#{news_id}",user_id)
    #   return false,"Duplicated vote."
    #end

    # Check if the user has enough karma to perform this operation
    #if $user['id'] != news['user_id']
    #    if (vote_type == :up and
    #         (get_user_karma(user_id) < NewsUpvoteMinKarma)) or
    #       (vote_type == :down and
    #         (get_user_karma(user_id) < NewsDownvoteMinKarma))
    #        return false,"You don't have enough karma to vote #{vote_type}"
    #    end
    #end

    # News was not already voted by that user. Add the vote.
    # Note that even if there is a race condition here and the user may be
    # voting from another device/API in the time between the ZSCORE check
    # and the zadd, this will not result in inconsistencies as we will just
    # update the vote time with ZADD.
    if $r.zadd("news.#{vote_type}:#{news_id}", Time.now.to_i, user_id)
        $r.hincrby("news:#{news_id}",vote_type,1)
    end
    $r.zadd("user.saved:#{user_id}", Time.now.to_i, news_id) if vote_type == :up

    # Compute the new values of score and karma, updating the news accordingly.
    score = compute_news_score(news)
    news["score"] = score
    rank = compute_news_rank(news)
    $r.hmset("news:#{news_id}",
        "score",score,
        "rank",rank)
    $r.zadd("news.top",rank,news_id)

    # Remove some karma to the user if needed, and transfer karma to the
    # news owner in the case of an upvote.
    #if $user['id'] != news['user_id']
    #    if vote_type == :up
    #        increment_user_karma_by(user_id,-NewsUpvoteKarmaCost)
    #        increment_user_karma_by(news['user_id'],NewsUpvoteKarmaTransfered)
    #    else
    #        increment_user_karma_by(user_id,-NewsDownvoteKarmaCost)
    #    end
    #end

    return rank,nil
end

def insert_news(title,url,text,user_id)
    # If we don't have an url but a comment, we turn the url into
    # text://....first comment..., so it is just a special case of
    # title+url anyway.
    textpost = url.length == 0
    if url.length == 0
        url = "text://"+text[0...CommentMaxLength]
    end
    # Check for already posted news with the same URL.
    if !textpost and (id = $r.get("url:"+url))
        return false
    end
    # We can finally insert the news.
    ctime = Time.new.to_i
    news_id = $r.incr("news.count")
    $r.hmset("news:#{news_id}",
        "id", news_id,
        "title", title,
        "url", url,
        "user_id", user_id,
        "ctime", ctime,
        "score", 0,
        "rank", 0,
        "up", 0,
        "down", 0,
        "comments", 0)
    # The posting user virtually upvoted the news posting it
    rank,error = vote_news(news_id,user_id,:up)
    # Add the news to the user submitted news
    $r.zadd("user.posted:#{user_id}",ctime,news_id)
    # Add the news into the chronological view
    $r.zadd("news.cron",ctime,news_id)
    # Add the news into the top view
    $r.zadd("news.top",rank,news_id)
    # Add the news url for some time to avoid reposts in short time
    $r.setex("url:"+url,PreventRepostTime,news_id) if !textpost
    # Set a timeout indicating when the user may post again
    #$r.setex("user:#{$user['id']}:submitted_recently",NewsSubmissionBreak,'1')
    return news_id
end

def setup_redis(uri=RedisURL)
    uri = URI.parse(uri)
    $r = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password) unless $r
end

# Main -----------------------
setup_redis

NEWS_QUEUE = "newnewsqueue"

NUM_USERS = 1

addedstory = false
news_string = $r.spop(NEWS_QUEUE)

while !addedstory and !news_string.nil?

    puts news_string
    parts = news_string.split("@")

    ntitle = parts.at(0).strip
    nurl = parts.at(1).strip

    if nurl.index("http://") == 0 or nurl.index("https://") == 0
        user_id = rand(NUM_USERS) + 1

        result =  insert_news(ntitle, nurl,"",user_id)

        if (result.is_a? Integer)
            addedstory = true
            puts "Done! Added " + ntitle + " at " + nurl
            break
        else
            addedstory = false
            puts "Nope. Already exits " + ntitle + " at " + nurl

            news_string = $r.spop(NEWS_QUEUE)
        end
    else
        puts "Bad url: " + nurl + " skipping"
        news_string = $r.spop(NEWS_QUEUE)
    end
end
