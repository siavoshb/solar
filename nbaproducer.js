var request = require('request');
var cheerio = require('cheerio');
var redis = require("redis");
var async = require('async');

PRODUCTION_MODE = true;

pools = {
    'http://hangtime.blogs.nba.com/?ls=iref:nba:gnav' : {'blog' : '.post h2 a', 'img' : '.post .entry img'},
    'http://allball.blogs.nba.com/' : {'blog' : '.post h2 a', 'img' : 'do-not-load-any-images'},
    'http://www.sbnation.com/nba-news-basketball-2013-14' : {'blog' : '.has-section h3 a', 'img' : '.m-entry__photo img'},
    'http://hardwoodparoxysm.com/' : {'blog' : '.entry-title a', 'img' : '.post .entry-content img'},
    'http://hoopspeak.com/' : {'blog' : '.post-headline h2 a', 'img' : '.post img'},
    
    'http://hoopchalk.com/' : {'blog' : '.entry-title a', 'img' : 'img'},
    'http://ballerball.com/' : {'blog' : '.entry-title a', 'img' : 'img'},
    'http://gothicginobili.com/' : {'blog' : '.entry-title a', 'img' : 'img'},
    'http://dimemag.com/' : {'blog' :'.post h2 a', 'img' : 'img'},
    'http://nba.si.com/' : {'blog' : '.post .inner .body h1 a', 'img' : 'img'},
    'http://sports.yahoo.com/blogs/nba-ball-dont-lie/' : {'blog' : '.body .body-wrap h3 a', 'img' : 'img'},
    'http://www.basketballinsiders.com/category/nba-draft/' : {'blog' : '.home-title1 a', 'img' : 'img'},
    'http://search.espn.go.com/brian-windhorst/' : {'blog' : '.result h3 a', 'img' : 'img'},
    'http://espn.go.com/blog/marc-stein/' : {'blog' : 'http://espn.go.com .mod-header h3 a', 'img' : 'img'},
    'http://espn.go.com/blog/truehoop/' : {'blog' : 'http://espn.go.com .mod-header h3 a', 'img' : 'img'},
    'http://grantland.com/contributors/zach-lowe/' : {'blog' : '.l-main .bd .headline a', 'img' : 'img'},
    'http://www.rotoworld.com/sports/nba/basketball/' : {'blog' : 'http://www.rotoworld.com .story h3 a', 'img' : 'img'},
    'http://grantland.com/contributors/jonathan-abrams/' : {'blog' : '.l-main .bd .headline a', 'img' : '.feature img'},
};

if (PRODUCTION_MODE) {
	client = redis.createClient(6380, '127.0.0.1', null);
    //client = redis.createClient(6379, '127.0.0.1', null);
}

blogs = []

async.each( 
    Object.keys(pools)
    
    ,function(url,callback) {
        var attrs = pools[url];
        blog_tagselector = attrs['blog']
        img_tagselector = attrs['img']

        request(url, ( function(blog_tagselector, callback) {

            return function(err, resp, body) {
                if (err)
                    throw err;
                $ = cheerio.load(body);

                append_url = false;
                append_given_url = false; given_url = '';

                if (blog_tagselector.indexOf("*append_url ") == 0) {
                    append_url = true;
                    blog_tagselector = blog_tagselector.replace("*append_url ", "")
                } else if (blog_tagselector.indexOf("http") == 0) {
                    append_given_url = true;
                    given_url = blog_tagselector.substring(0, blog_tagselector.indexOf(" "));
                    blog_tagselector = blog_tagselector.replace(given_url+" ", "");
                }

                // console.log(blog_tagselector)
                
                $(blog_tagselector).each(function(post)
                {
                        blog_post_url = "";
                        if (append_url) {
                            blog_post_url = url + $(this).attr('href');
                        } else if (append_given_url) {
                            blog_post_url = given_url + $(this).attr('href');
                        } else {
                            blog_post_url = $(this).attr('href');
                        }

                        // image
                        var newentry = $(this).text().trim() +  " @  " + blog_post_url;

                        blogs[newentry] = img_tagselector
                });

                callback()
            }
        })(blog_tagselector, callback, blogs));
    }
    
    ,function(err) {
        async.each(
            Object.keys(blogs)
            , function(newentry,callback) {
                var img_tagselector = blogs[newentry];
                
                blog_post_url = newentry.split(" @ ")[1]

                request(blog_post_url, function(error, response, body) {

                    $ = cheerio.load(body);

                    $(img_tagselector).each(function(post)
                    {
                        // console.log($(this).attr('src'))
                        var imgsrc = $(this).attr('src');
                        var newEntryWithImage = newentry + " @ " + imgsrc;
                        console.log(newEntryWithImage)

                        if (PRODUCTION_MODE) {
                            console.log(newEntryWithImage)
                            client.sadd("newnewsqueue", newEntryWithImage);
                        }
                    })

                    callback()
                })
            }
            , function(err) {
                //console.log("done! closing connection with redis")
                if (PRODUCTION_MODE) {
                    client.quit() 
                }
            })
        }
    )