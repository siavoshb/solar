var request = require('request');
var cheerio = require('cheerio');
var redis = require("redis");
var async = require('async');

pools = {
    'http://blog.lostartpress.com/': '.post .entry-title a',
    'http://benchcrafted.blogspot.com/' : '.post-title a',
    'http://thecarpentryway.blogspot.com/' : '.post-title a',
    'http://www.rpwoodwork.com/blog/' : '.posttitle a',
    'http://www.theunpluggedwoodshop.com/' : '.entry-title a',
    'http://www.closegrain.com/' : '.post-title a',
    'http://flairwoodworks.com/blog/' : '.entry-title a',
    'http://www.renaissancewoodworker.com/blog/' : '.entry-title a',
    'http://literaryworkshop.wordpress.com/' : '.entry-title a',
    'http://www.theenglishwoodworker.com/' : '#latest .spost h2 a',
    'http://www.chairnotes.blogspot.com/' : '.entry-title a',
    'http://paulsellers.com/woodworking-blog/paul-sellers-blog/' : '.entry-title a',
    'http://pfollansbee.wordpress.com/' : '.post-title a',
    'http://brokenriverjoinery.wordpress.com/' : '.entry-title a',
    'http://uppercutwoodworks.com/tag/woodworking-blog/' : '.entry-title a',
    'http://toolerable.blogspot.com/' : '.entry-title a',
    'http://seanhellman.blogspot.com/' : '.entry-title a',
    'http://alaskawoodworker.wordpress.com/' : '.entry-title a',
    'http://dblaney.wordpress.com/' : '.post h2 a',
    'http://mcglynnonmaking.wordpress.com/' : '.entry-title a',
    'http://stevetomlincrafts.wordpress.com/blog-2/' : '.entry-title a',
    'http://blueoakblog.wordpress.com/' : '.entry-title a',
    'http://musingsfrombigpink.blogspot.com/' : '.entry-title a',
    'http://licensed2tinker.blogspot.com/' : '.entry-title a',
    'http://sheworkswood.com/' : '.post h2 a',
    'http://handtooljourney.wordpress.com/' : '.entry-title a',
    'http://theloveofwood.blogspot.com/' : '.entry-title a',
    'http://www.chineblog.com/' : '.post-headline h2 a',
    'http://www.popularwoodworking.com/woodworking-blogs/editors-blog' : '.entry-title a',
    'http://www.popularwoodworking.com/woodworking-blogs/chris-schwarz-blog' : '.entry-title a',
    'http://www.popularwoodworking.com/woodworking-daily' : '.entry-title a',
    'http://www.popularwoodworking.com/woodworking-blogs/contributors-blog' : '.entry-title a',
    'http://www.popularwoodworking.com/woodworking-blogs/arts-mysteries-blogs/' : '.entry-title a',
    'http://www.flyingshavings.co.uk/' : '.entry-title a',
    'http://mulesaw.blogspot.com/' : '.entry-title a',
    'http://oregonwoodworker.blogspot.com/' : '.entry-title a',
    'http://giantcypress.net/' : '.thelink p a',
    'http://wisdomofhands.blogspot.com/' : '.entry-title a',
    'http://accidentalwoodworker.blogspot.com/' : '.entry-title a',
    'http://www.blackburntools.com/blog/' : '.entry-title a',
    'http://dougberch.com/blog/' : '.entry-title a',
    'http://pegsandtails.wordpress.com/' : '.entry-title a',
    'http://bowsaw.wordpress.com/' : '.entry-title a',
    'http://guitarluthier.blogspot.com/' : '.entry-title a',
    'http://georgewalkerdesign.wordpress.com/' : '.entry-title a',
    'http://mattsbasementworkshop.com/' : '.post-title a',
    'http://www.brianboggschairmakers.com/category/chairmakers_journal/' : '.post-title a',
    'http://theparttimewoodworker.blogspot.com/' : '.entry-title a',
    'http://stuartblanchard.com/blogpage/' : '.entry-title a',
    'http://jarrodstonedahl.blogspot.com/' : '.entry-title a',
    'http://www.blogcht.com/blog/' : '.entry-title a',
    'http://davidbarronfurniture.blogspot.co.uk/' : '.entry-title a',
    'http://philsville.blogspot.com/' : '.entry-title a',
    'http://www.floweringelbow.org/' : '.post h1 a',
    'http://jeffbranch.wordpress.com/blog/' : '.title a',
    'http://zkprojectnotebook.wordpress.com/' : '.entry-title a',
    'http://donsbarn.com/musings/' : '.post_title a',
    'http://furnituremaking.com/wordpress/' : '.entry-title a',
    'http://www.davidfinck.com/blog/' : '.entry-title a',
    'http://www.halfinchshy.com/' : '.entry-title a',
    'http://combraystudio.blogspot.com/' : '.entry-title a',
    'http://www.daedtoolworks.com/blog/' : '.post h2 a',
    'http://cornishworkshop.blogspot.com/' : '.entry-title a',
    'http://blog.woodworkingtooltips.com/' : '.posttitle a',
    'http://penultimatewoodshop.blogspot.com/' : '.post-title  a',
    'http://toolerable.blogspot.com/' : '.post-title a',
    'http://www.badgerwoodworks.com/blog/' : '.entry-title a',
    'http://blacksheepwoodworker.wordpress.com/' : '.entry-title a',
    'http://littlegoodpieces.wordpress.com/' : '.entry-title a',
    'http://highrockwoodworking.com/' : '.entry-title a',
    'http://sandal-woodsblog.com/' : '.entry-title a',
    'http://stusshed.com/' : '.post h2 a',
    'http://thecornerworkshop.blogspot.com/' : '.post-title a',
    'http://digitalwoodworker.com/' : '.post h2 a',
    'http://www.fullchisel.com/blog/' : '.storytitle a',
    'http://logancabinetshoppe.com/blog/' : '.entry-title a',
    'http://www.toolsforworkingwood.com/store//store/blog/joel' : 'td h1 a',
    'http://www.toolsforworkingwood.com/store//store/blog/work' : 'td h1 a',
    'http://dorsetcustomfurniture.blogspot.com/' : 'entry-title a',
    'http://www.cabinwoodworks.com/' : '.post h2 a',
    'http://beavesbench.com/' : '.post-title a',
    'http://nelsonwoodcraft.blogspot.com/' : '.post-title a',
    'http://nabilabdo.blogspot.com/' : '.post-title a',
    'http://lumberjocks.com' : '*append_url .one-three h3 a',
    'http://www.toolsfromjapan.com/wordpress/?cat=3' : '.post-headline h2 a',
    'http://orepass.wordpress.com/' : '.post h2 a',
    'http://thesawblog.com/' : '.entry-title a',
    'http://rainfordrestorations.wordpress.com/' : '.entry-title a',
    'http://frontiercarpenter.blogspot.com/' : '.entry-title a',
    'http://leelairdwoodworking.blogspot.com/' : '.post-title a',
    'http://dennisyoung-kagu.blogspot.com/' : '.post-title a',
    'http://fabulalignarius.wordpress.com/' : '.entry-title a',
    'http://www.robin-wood.co.uk/wood-craft-blog/' : '.title a',
    'http://confusedwoodworker.wordpress.com/' : '.post h2 a',
    'http://handguitar.wordpress.com/' : '.entry-title a',
    'http://madebystephenhughes.com/blog/' : '.entry-title a',
    'http://zerofret.wordpress.com/' : '.entry-title a',
    'http://astriddegroot.wordpress.com/' : '.post h1 a',
    'http://theschoolofthetransferofenergy.com/' : '.post h1 a',
    'http://mvflaim.wordpress.com/' : '.post-title h1 a',
    'http://millcrek.wordpress.com/' : '.entry-title a',
    'http://npcarey.wordpress.com/category/ukulele/' : '.entry-title a',
    'http://timetestedtools.wordpress.com/' : '.entry h2 a',
    'http://thebutlerdiditwoodworks.com/' : '.entry-title a',
    'http://homegrownlutherie.wordpress.com/' : '.post-title h1 a',
    'http://timewarptoolworks.com/category/from-the-workshop/' : '.entry-title a',
    'http://integritywoodworks.wordpress.com/blog/' : '.entry-title a',
    'http://randomrovers.wordpress.com/' : '.entry-title a',
    'http://togetherwewood.wordpress.com/' : '.entry-title a',
    'http://northsummitblog.wordpress.com/' : '.entry-title a'
};

client = redis.createClient(6379, '127.0.0.1', null);

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
                if (tagselector.indexOf("*append_url ") == 0) {
                    append_url = true;
                    tagselector = tagselector.replace("*append_url ", "")

                    console.log(tagselector)
                }

	            
	            $(tagselector).each(function(post)
                {
                        blog_post_url = "";
                        if (append_url) {
                            blog_post_url = url + $(this).attr('href');
                        } else {
                            blog_post_url = $(this).attr('href');
                        }

			    		var newentry = $(this).text().trim() +  " @  " + blog_post_url;
	            		client.sadd("newnewsqueue", newentry);
			        	console.log(newentry);
				});

				callback()
	        }
	    })(tagselector, callback));
	}
	
	,function(err) {
		//console.log("done! closing connection with redis")
		client.quit() 
	});


