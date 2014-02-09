var request = require('request');
var cheerio = require('cheerio');
var redis = require("redis");
var async = require('async');

PRODUCTION_MODE = true;

pools = {
    'http://hangtime.blogs.nba.com/?ls=iref:nba:gnav' : '.post h2 a',
    'http://allball.blogs.nba.com/' : '.post h2 a',
    'http://www.sbnation.com/nba-news-basketball-2013-14' : '.has-section h3 a',
    'http://hardwoodparoxysm.com/' : '.entry-title a',
    'http://hoopspeak.com/' : '.post-headline h2 a',
    'http://hoopchalk.com/' : '.entry-title a',
    'http://ballerball.com/' : '.entry-title a',
    'http://gothicginobili.com/' : '.entry-title a',
    'http://dimemag.com/' : '.post h2 a',
    'http://nba.si.com/' : '.post .inner .body h1 a',
    'http://sports.yahoo.com/blogs/nba-ball-dont-lie/' : '.body .body-wrap h3 a',
    'http://www.basketballinsiders.com/category/nba-draft/' : '.home-title1 a',
    'http://search.espn.go.com/brian-windhorst/' : '.result h3 a',
    'http://espn.go.com/blog/marc-stein/' : 'http://espn.go.com .mod-header h3 a',
    'http://espn.go.com/blog/truehoop/' : 'http://espn.go.com .mod-header h3 a',
    'http://grantland.com/contributors/zach-lowe/' : '.bd .headline a'
};

if (PRODUCTION_MODE) {
	client = redis.createClient(6380, '127.0.0.1', null);
}

async.each( 
	Object.keys(pools)
	
	,function(url,callback) {
		var tagselector = pools[url];

	    request(url, ( function(tagselector, callback) {

	        return function(err, resp, body) {
	            if (err)
	                throw err;
	            $ = cheerio.load(body);

                append_url = false;
                append_given_url = false; given_url = '';

                if (tagselector.indexOf("*append_url ") == 0) {
                    append_url = true;
                    tagselector = tagselector.replace("*append_url ", "")

                    console.log(tagselector)
                } else if (tagselector.indexOf("http") == 0) {
                	append_given_url = true;
                	given_url = tagselector.substring(0, tagselector.indexOf(" "));
                	tagselector = tagselector.replace(given_url+" ", "");
                }

                // console.log(tagselector)
	            
	            $(tagselector).each(function(post)
                {
                        blog_post_url = "";
                        if (append_url) {
                            blog_post_url = url + $(this).attr('href');
                        } else if (append_given_url) {
                        	blog_post_url = given_url + $(this).attr('href');
                        } else {
                            blog_post_url = $(this).attr('href');
                        }

			    		var newentry = $(this).text().trim() +  " @  " + blog_post_url;

			    		if (PRODUCTION_MODE) {
	            			client.sadd("newnewsqueue", newentry);
	            		}
			        	console.log(newentry);
				});

				callback()
	        }
	    })(tagselector, callback));
	}
	
	,function(err) {
		//console.log("done! closing connection with redis")
		if (PRODUCTION_MODE) {
			client.quit() 
		}
	});


