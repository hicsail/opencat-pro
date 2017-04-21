/*******************************************************************
/* 508addthis.js
/* This file creates an addthis object and injects into DOM.
/*
/* Required:  <a> with id="#508addthis"
/*******************************************************************/
function AddThis() {
    var self = this,
        exitIcon = '<span class="sr-only">This link opens a new window or tab</span>';
    this.root = $("#508addthis");
    self.root.attr("id", "508addthis");
    self.root.attr("title", "Bookmark and Share");
    self.root.attr("href", "javascript:void(0)");
    this.rootText = self.root.html();
    this.rootText508 = "<span class='sr-only'> widget - Select to show</span>";
    this.at_hover_lis = "<li id='atic_twitter' class='at_itemz at_bold at_col0'><a class='wrap sr-set' target='_blank' href='" + getShareUrl("Twitter") + "'><span class='at15tz at15t_twitter'></span><span class='social-site-name'>Twitter " + exitIcon + "</span></a></li>" +
        "<li id='atic_blogger' class='at_itemz at_bold at_col1'><a class='blogger sr-set' target='_blank' href='" + getShareUrl("Blogger") + "'><span class='at15tz at15t_blogger'></span><span class='social-site-name'>Blogger " + exitIcon + "</span></a></li>" +
        "<li id='atic_facebook' class='at_itemz at_bold at_col0'><a class='fb sr-set' target='_blank' href='" + getShareUrl("Facebook") + "'><span class='at15tz at15t_facebook'></span><span class='social-site-name'>Facebook " + exitIcon + "</span></a></li>" +
        "<li id='atic_reddit' class='at_itemz at_bold at_col1'><a class='reddit sr-set' target='_blank' href='" + getShareUrl("Reddit") + "'><span class='at15tz at15t_reddit'></span><span class='social-site-name'>Reddit " + exitIcon + "</span></a></li>" +
        "<li id='atic_stumbleupon' class='at_itemz at_col0'><a class='stumble sr-set' target='_blank' href='" + getShareUrl("StumbleUpon") + "'><span class='at15tz at15t_stumbleupon'></span><span class='social-site-name'>StumbleUpon " + exitIcon + "</span></a></li>" +
        "<li id='atic_favorites' class='at_itemz at_col1'><a class='favs' href='javascript:void(0);'><span class='at15tz at15t_favorites'></span><span class='social-site-name'>Favorites</span></a></li>" +
        "<li id='atic_gmail' class='at_itemz at_col0'><a class='gmail sr-set' target='_blank' href='" + getShareUrl("Gmail") + "'><span class='at15tz at15t_gmail'></span><span class='social-site-name'>Gmail " + exitIcon + "</span></a></li>" +
        "<li id='atic_tumblr' class='at_itemz at_col1'><a class='tumblr sr-set' target='_blank' href='" + getShareUrl("Tumblr") + "'><span class='at15tz at15t_tumblr'></span><span class='social-site-name'>Tumblr " + exitIcon + "</span></a></li>";

    this.approvedHTML = "<div id='at20mc' class='share-links-container'><div class='share-links-container-border' id='at15s' style='display: none' aria-hidden='true'><div class='contents' id='at15s_inner'><div class='share-links-head' id='at15s_head'><a id='at15sptx' class='close' title='Click to close small share modal' tabindex='0'><em class='fa fa-times' style='font-family :'FontAwesome' !important'><span class='adobeBlank' aria-hidden='true'>Close Bookmark and Share</span></em><span class='sr-only'>Close Bookmark and Share</span></a><h2 class='heading' id='at15ptc'>Bookmark & Share</h2><span id='at15s_brand' class='at15s_brandx'></span></div><ul class='clearfix' id='at_hover'>" + self.at_hover_lis + "</ul></div></div></div>";
    this.bind = function() {
        self.root.html(self.rootText + self.rootText508);
        self.root.parent().append(self.approvedHTML);

        self.root.click(function() {
            self.showShare();
        });

        $('#at15sptx').click(function() {
            self.closeShare(true);
        });

        $('#atic_favorites').click(function() {
            self.addFavorite(document.location.href, document.title);
        });

        $('#at20mc').keyup(function(e) {
            // esc out of modal
            if (e.keyCode == 27) {
                self.closeShare(true);
            }
        });
    }

    this.addFavorite = function(url, title) {
        if (document.all) { // ie
            window.external.AddFavorite(url, title);
        } else if (window.sidebar && window.sidebar.AddPanel) {
            // firefox 23 and below
            window.sidebar.addPanel(title, url, "");
        } else if (/chrome/.test(navigator.userAgent.toLowerCase())) {
            alert('Press CTRL + D to bookmark this page.');
        } else if (navigator.userAgent.toLowerCase().indexOf('safari') != -1) { //Safari
            alert('Press Command + D to bookmark this page.');
        } else {
            alert('Press CTRL + D to bookmark this page.');
        }
    }

    this.closeShare = function(resetFocus) {
        self.hideShare();
        if (resetFocus) {
            $('#at300m').focus();
        }
    }

    this.showShare = function() {
        var objPanel = document.getElementById('at15s');

        $('#at15s').show();
        $('#at15s').attr('aria-hidden', 'false');
        $('#at15sptx').focus();
        $(document).on("focusin.508addthis", function(e) {
            var target = $(e.target);
            if (!$.contains($('#at20mc').get(0), target.get(0))) {
                self.closeShare(false);
            }
        });
        if (objPanel.offsetLeft < 0) {
            objPanel.style.left = 0;
        }

    }

    this.hideShare = function() {
        $('#at15s').hide();
        $('#at15s').attr('aria-hidden', 'true');
        $(document).off("focusin.508addthis");
    }

    function getShareUrl(site) {
        var linkRef = document.location.href;
        var title = document.title;

        switch (site) {
            case 'Twitter':
                return "http://www.twitter.com/share?url=" + encodeURIComponent(linkRef) + '&text=' + encodeURIComponent(title);
                break;
            case 'Tumblr':
                return "http://www.tumblr.com/share?v=3&u=" + encodeURIComponent(linkRef) + "&t=" + encodeURIComponent(title) + "&s=";
                break;
            case 'StumbleUpon':
                return "http://www.stumbleupon.com/submit?url=" + encodeURIComponent(linkRef) + "&title=" + encodeURIComponent(title);
                break;
            case 'Reddit':
                return "http://www.reddit.com/submit?url=" + encodeURIComponent(linkRef) + "&title=" + encodeURIComponent(title);
                break;
            case 'Gmail':
                return "https://mail.google.com/mail/?view=cm&fs=1&to&su=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(linkRef);
                break;
            case 'Favorites':
                return "javascript:addFavorite();"
                break;
            case 'Facebook':
                return "http://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(linkRef);
                break;
            case 'Blogger':
                var bloggerTitle = title.replace(/ /g, '+');
                return "http://www.blogger.com/blog-this.g?t=" + bloggerTitle + "&n=" + encodeURIComponent(linkRef);
                break;
        }
    }
    self.bind();
}

$(document).ready(function() {
    if ($("a#508addthis").html() != null) {
        var addThis = new AddThis();
    }
});