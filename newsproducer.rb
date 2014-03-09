require_relative 'app_config'
require 'rubygems'
require 'hiredis'
require 'redis'
require 'json'
require 'uri'
require 'net/http'
require 'nokogiri'

def setup_redis(uri=RedisURL)
	uri = URI.parse(uri)
	$r = Redis.new(:host => uri.host, :port => uri.port, :password => uri.password) unless $r
end

def load_user_json( filename )
	JSON.parse( IO.read(filename) )
end

def make_http_request( url_string )
	url = URI.parse(url_string)
	req = Net::HTTP::Get.new(url.path)
	res = Net::HTTP.start(url.host, url.port) {|http|
		http.request(req)
	}
	
	res.body
end

def construct_blog_url(post_url, parameters)
	if parameters['append_base_url_to_blog_url']
		post_url = url_string + post_url
	elsif parameters['append_custom_url_to_blog_url']
		post_url = parameters['append_custom_url_to_blog_url'] + post_url
	end
	post_url
end

def construct_news_entry_string(title, url, img_url)
	news_entry_title = title + " @ " + url
	if img_url
		news_entry_title = news_entry_title + " @ " + img_url
	end

	news_entry_title
end

def main
	setup_redis
	
	blogs = load_user_json(BlogSitesJson)

	blogs.each do |url_string, parameters|
		begin
			puts "\n"
			webpage_html = make_http_request(url_string)
			page_dom = Nokogiri::HTML(webpage_html)
			blog_posts = page_dom.css(parameters['blog'])

			blog_posts.each do |post_link_html|
				
				post_title = post_link_html.text
				post_url = construct_blog_url(post_link_html['href'], parameters)

				puts "requesting and parsing\t#{post_title} - #{post_url}"
				post_html = make_http_request(post_url)
				post_dom = Nokogiri::HTML(post_html)

				img_url = nil

				if parameters['img']
					img_link_html = post_dom.css(parameters['img'])[0]
					if img_link_html
						img_url = img_link_html['src']
					end
				end

				news_entry_string = construct_news_entry_string(post_title, post_url, img_url)
				$r.sadd(NewsQueue, news_entry_string)

			end

		rescue
			puts "Exception occured scraping #{url_string}"
		end

	end

end



puts Time.now.to_s + "\tRunning producer for " + BlogSitesJson
main


