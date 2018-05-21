/*!
 * jquery-dice-menu v1.0.0 (https://github.com/ssmak/jquery-dice-menu)
 * Author: Steve Mak (https://github.com/ssmak)
 * Licensed under the MIT license
 */
"use strict";

(function($) {
    $(function() {
        // console.log('dice-menu inited');

        //dice-menu onclick event
        $('.dice-menu li').click(function() {
            if($(this).find('span').attr('class') == $(this).parent().find('li:first-child > span').attr('class')) {
                //click on root element
                // console.log('click dice-menu root element');

                if($(this).parent().find('li:nth-child(2)').css('opacity') == 0) {
                    //show dice-menu
                    $(this).parent().find('li:nth-child(1n+2) > span').each(function() {
                        // console.log($(this).attr('class'));
                        $(this).parent().animate({'opacity': 0.8}, 150);
                    });
                } else {
                    //hide dice-menu
                    $(this).parent().find('li:nth-child(1n+2) > span').each(function() {
                        // console.log($(this).attr('class'));
                        $(this).parent().animate({'opacity': 0}, 150);
                    });
                }
            } else {


                //collapse the floating navbar
                $(this).parent().find('li:nth-child(1n+2) > span').each(function() {
                    // console.log($(this).attr('class'));
                    $(this).parent().animate({'opacity': 0}, 150);
                });
            }
        });

        //dice-menu mouseenter event
        $('.dice-menu li').mouseenter(function() {
            if($(this).find('span').attr('class') != $(this).parent().find('li:first-child > span').attr('class')) {
                //non root element
                if($(this).css('opacity') == 0.8) {
                    //reset all the other buttons to opacity 0
                    $(this).parent().find('li:nth-child(1n+2) > span').each(function() {
                        // console.log($(this).attr('class'));
                        $(this).parent().animate({'opacity': 0.8}, 150);
                    });

                    //fade in
                    $(this).animate({opacity: 1}, 150);
                }
            }
        });

        $('.dice-menu li').mouseout(function() {
            if($(this).find('span').attr('class') != $(this).parent().find('li:first-child > span').attr('class')) {
                //non root element
                if($(this).css('opacity') == 1) {
                    //fade out
                    $(this).animate({opacity: 0.8}, 150);
                }
            }
        });
    });
})(jQuery);