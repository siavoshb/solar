get '/about' do
    H.set_title "About - #{SiteName}"
    H.page {
        H.div(:id => "about") {
            H.h2 {"#{SiteName}"}+
            H.p {"<br>"}+
            H.p {"There's an amazing amount of wonderful woodworking content online. Much of them in blogs written by hobbysts, but I could never find an easy and convenient way to keep up with all of them. " +
                "One of the primary focus' of this feed is hand tool woodworking, both Western and Eastern styles." +
                "My hope is a community can develop here where user submitted links and discussions can foster greater attention to all the great bloggers and woodworkers who sometimes wonder if their effort inspires others. Happy reading!"}+
            H.p {"<br>"}+
            H.p {"-Siavosh (Feel free to email me at siavoshb [at] yahoo)"}+
            H.p {"<a href=\"http://siavoshb.tumblr.com/\">siavoshb.tumblr.com</a>"}+
            H.p {"<br>"}
        }
    }
end
