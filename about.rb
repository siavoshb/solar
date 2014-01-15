get '/about' do
    H.set_title "About - #{SiteName}"
    H.page {
        H.div(:id => "about") {
            H.h2 {"#{SiteName}"}+
            H.p {"<br>"}+
            H.p {"Woodspotting is an implementation of a Reddit / Hacker News style news web site. As I've gotten more and more interested in woodworking, particularly, with hand tools, I've discovered an amazing amount of content online. Much of them in blogs written by other hobbysts, but I could never find an easy and convenient way to keep up with all the great content. My hope is a community can develop here where user submitted links and discussions can foster greater attention to all the great bloggers and woodworkers who sometimes wonder if their effort inspires others. Happy reading!"}+
            H.p {"<br>"}+
            H.p {"-Siavosh (Feel free to email me at siavoshb [at] yahoo)"}+
            "<a class=\"coinbase-button\" data-code=\"c9e8647a85852c04ceb36711f02bb94d\" data-button-style=\"donation_small\" href=\"https://coinbase.com/checkouts/c9e8647a85852c04ceb36711f02bb94d\">Donate Bitcoins</a><script src=\"https://coinbase.com/assets/button.js\" type=\"text/javascript\"></script>"+
            H.p {"<br>"}+
            H.p {"The code (with some minor changes) is from the generous open source project lamernews authored by antirez: https://github.com/antirez/lamernews"}

        }
    }
end
