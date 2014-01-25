var request = require('request');
var cheerio = require('cheerio');
var redis = require("redis");
var async = require('async');

pools = {
    'http://hangtime.blogs.nba.com/?ls=iref:nba:gnav' : '.post h2 a',
    'http://allball.blogs.nba.com/?ls=iref:nba:gnav' : '.post h2 a',
    'http://tbt.blogs.nba.com/?ls=iref:nba:gnav' : '.post h2 a',
    'http://espn.go.com/nba/' : '.headlines li a',
    'http://grantland.com/tags/nba/' : '.headline a',
    'http://hoopshype.com/articles.htm' : '.cms-item h1 a',
    'http://www.sbnation.com/nba-news-basketball-2013-14' : '.has-section h3 a',
    'http://basketball.realgm.com/' : '.headlines ul li a'
};

client = redis.createClient(6380, '127.0.0.1', null);

async.each( 
	Object.keys(pools)
	
	,function(url,callback) {
		var tagselector = pools[url];

	    request(url, ( function(tagselector, callback) {

	        return function(err, resp, body) {
	            if (err)
	                throw err;
	            $ = cheerio.load(body);
	            
	            $(tagselector).each(function(post) {
			    	
			    		var newentry = $(this).text().trim() +  " @  " + $(this).attr('href');
	            		client.lpush("newnewsqueue", newentry);
			        	console.log(newentry);
				});

				callback()
	        }
	    })(tagselector, callback));
	}
	
	,function(err) {
		console.log("done! closing connection with redis")
		client.quit() 
	});


