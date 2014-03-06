var request = require('request');
var cheerio = require('cheerio');
var redis = require("redis");
var async = require('async');

PRODUCTION_MODE = true;

if (PRODUCTION_MODE) {
    client = redis.createClient(6379, '127.0.0.1', null);
}

pools = {
    'http://paulsellers.com/woodworking-blog/paul-sellers-blog/' : {'blog' : '.entry-title a', 'img' : '.post .entry-content img'},
    'http://blog.lostartpress.com/' : {'blog' : '.post .entry-title a', 'img' : '.post .entry-content img'},
    'http://benchcrafted.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://thecarpentryway.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://www.rpwoodwork.com/blog/' : {'blog' : '.posttitle a', 'img' : '.entry-content img'},
    'http://www.theunpluggedwoodshop.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.closegrain.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://flairwoodworks.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.renaissancewoodworker.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://literaryworkshop.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.theenglishwoodworker.com/' : {'blog' : '#latest .spost h2 a', 'img' : '.entry-content img'},
    'http://www.chairnotes.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://pfollansbee.wordpress.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://brokenriverjoinery.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://uppercutwoodworks.com/tag/woodworking-blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://toolerable.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://seanhellman.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://alaskawoodworker.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://dblaney.wordpress.com/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://mcglynnonmaking.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://stevetomlincrafts.wordpress.com/blog-2/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://blueoakblog.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://musingsfrombigpink.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://licensed2tinker.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://sheworkswood.com/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://handtooljourney.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://theloveofwood.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.chineblog.com/' : {'blog' : '.post-headline h2 a', 'img' : '.entry-content img'},
    'http://www.popularwoodworking.com/woodworking-blogs/editors-blog' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.popularwoodworking.com/woodworking-blogs/chris-schwarz-blog' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.popularwoodworking.com/woodworking-daily' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.popularwoodworking.com/woodworking-blogs/contributors-blog' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.popularwoodworking.com/woodworking-blogs/arts-mysteries-blogs/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.flyingshavings.co.uk/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://mulesaw.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://oregonwoodworker.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://giantcypress.net/' : {'blog' : '.thelink p a', 'img' : '.entry-content img'},
    'http://wisdomofhands.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://accidentalwoodworker.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.blackburntools.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://dougberch.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://pegsandtails.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://bowsaw.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://guitarluthier.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://georgewalkerdesign.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://mattsbasementworkshop.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://www.brianboggschairmakers.com/category/chairmakers_journal/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://theparttimewoodworker.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://stuartblanchard.com/blogpage/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://jarrodstonedahl.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.blogcht.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://davidbarronfurniture.blogspot.co.uk/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://philsville.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.floweringelbow.org/' : {'blog' : '.post h1 a', 'img' : '.entry-content img'},
    'http://jeffbranch.wordpress.com/blog/' : {'blog' : '.title a', 'img' : '.entry-content img'},
    'http://zkprojectnotebook.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://donsbarn.com/musings/' : {'blog' : '.post_title a', 'img' : '.entry-content img'},
    'http://furnituremaking.com/wordpress/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.davidfinck.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.halfinchshy.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://combraystudio.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.daedtoolworks.com/blog/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://cornishworkshop.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://blog.woodworkingtooltips.com/' : {'blog' : '.posttitle a', 'img' : '.entry-content img'},
    'http://penultimatewoodshop.blogspot.com/' : {'blog' : '.post-title  a', 'img' : '.entry-content img'},
    'http://toolerable.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://www.badgerwoodworks.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://blacksheepwoodworker.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://littlegoodpieces.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://highrockwoodworking.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://sandal-woodsblog.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://stusshed.com/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://thecornerworkshop.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://digitalwoodworker.com/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://www.fullchisel.com/blog/' : {'blog' : '.storytitle a', 'img' : '.entry-content img'},
    'http://logancabinetshoppe.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.toolsforworkingwood.com/store//store/blog/joel' : {'blog' : 'td h1 a', 'img' : '.entry-content img'},
    'http://www.toolsforworkingwood.com/store//store/blog/work' : {'blog' : 'td h1 a', 'img' : '.entry-content img'},
    'http://dorsetcustomfurniture.blogspot.com/' : {'blog' : 'entry-title a', 'img' : '.entry-content img'},
    'http://www.cabinwoodworks.com/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://beavesbench.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://nelsonwoodcraft.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://nabilabdo.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://lumberjocks.com' : {'blog' : '*append_url .one-three h3 a', 'img' : '.entry-content img'},
    'http://www.toolsfromjapan.com/wordpress/?cat=3' : {'blog' : '.post-headline h2 a', 'img' : '.entry-content img'},
    'http://orepass.wordpress.com/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://thesawblog.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://rainfordrestorations.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://frontiercarpenter.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://leelairdwoodworking.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://dennisyoung-kagu.blogspot.com/' : {'blog' : '.post-title a', 'img' : '.entry-content img'},
    'http://fabulalignarius.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.robin-wood.co.uk/wood-craft-blog/' : {'blog' : '.title a', 'img' : '.entry-content img'},
    'http://confusedwoodworker.wordpress.com/' : {'blog' : '.post h2 a', 'img' : '.entry-content img'},
    'http://handguitar.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://zerofret.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://astriddegroot.wordpress.com/' : {'blog' : '.post h1 a', 'img' : '.entry-content img'},
    'http://theschoolofthetransferofenergy.com/' : {'blog' : '.post h1 a', 'img' : '.entry-content img'},
    'http://mvflaim.wordpress.com/' : {'blog' : '.post-title h1 a', 'img' : '.entry-content img'},
    'http://millcrek.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://npcarey.wordpress.com/category/ukulele/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://timetestedtools.wordpress.com/' : {'blog' : '.entry h2 a', 'img' : '.entry-content img'},
    'http://thebutlerdiditwoodworks.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://homegrownlutherie.wordpress.com/' : {'blog' : '.post-title h1 a', 'img' : '.entry-content img'},
    'http://timewarptoolworks.com/category/from-the-workshop/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://integritywoodworks.wordpress.com/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://togetherwewood.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://northsummitblog.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://planeshavings.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://traditionalskills.wordpress.com/' : {'blog' : '.post-title h1 a', 'img' : '.entry-content img'},
    'http://kskdesign.com.au/blog/blog.html/' : {'blog' : '.blog-entry-title a', 'img' : '.entry-content img'},
    'http://uppercutwoodworks.com/uppercut-woodworks-blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://newenglishworkshop.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://northwestwoodworking.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.galoototron.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://thefamelesswoodworker.com/' : {'blog' : '.post-title h1 a', 'img' : '.entry-content img'},
    'http://www.finefurnituremaker.com/news/blog/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://feeds.feedburner.com/PeonyWoodworks?format=html' : {'blog' : '.regularitem .itemtitle a', 'img' : '.entry-content img'},
    'http://imaokguy.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://www.spooncarvingfirststeps.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://simonhillgreenwoodwork.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://customfurniture.us/index.php/furniture-blog/' : {'blog' : 'http://customfurniture.us .blog .item h2 a', 'img' : '.entry-content img'},
    'http://zkprojectnotebook.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://skottbenk.wordpress.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://woodbloker.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://woodworkingbyhand2.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'},
    'http://kiyond.blogspot.com/' : {'blog' : '.entry-title a', 'img' : '.entry-content img'}
};

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
