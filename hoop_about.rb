get '/about' do
    H.set_title "About - #{SiteName}"
    H.page {
        H.div(:id => "about") {
            H.h2 {"#{SiteName}"}+
            H.p {"<br>"}+
            H.p {"An intellectual discourse of all things NBA and dunk videos."}+
            H.p {"<br>"}+
            H.p {"<br>"}+
            H.p {"<a href=\"http://siavoshb.tumblr.com/\">siavoshb.tumblr.com</a>"}+
            "<a class=\"coinbase-button\" data-code=\"c9e8647a85852c04ceb36711f02bb94d\" data-button-style=\"donation_small\" href=\"https://coinbase.com/checkouts/c9e8647a85852c04ceb36711f02bb94d\">Donate Bitcoins</a><script src=\"https://coinbase.com/assets/button.js\" type=\"text/javascript\"></script>"+
            H.p {"<br>"}
        }
    }
end
