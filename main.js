/*
 * Nixie_Display Node.js app.
 *
 * Display time, date and weather information on nixie tubes connected to the Intel Edison.
 *
 * <https://www.element14.com/community/community/design-challenges/upcycleit/blog/2017/03/22/upcycle-it-with-edison-upcycled-nixie-display-1-introduction>
 */


"use strict";

var mraa = require("mraa");

console.log(mraa);     // prints mraa object to XDK IoT debug output panel

var five = require("johnny-five");
var Edison = require("edison-io");
var board = new five.Board({
    io: new Edison()
});
var display_function = 0;
var MAXFUNCTION = 1; // largest function number
var switch_function = false;

board.on("ready", function () {

    var virtual1 = new five.Board.Virtual(
        new five.Expander({
            controller: "PCF8574A",
            address: 0x3A
        })
    );
    var virtual2 = new five.Board.Virtual(
        new five.Expander({
            controller: "PCF8574A",
            address: 0x39
        })
    );
    var virtual3 = new five.Board.Virtual(
        new five.Expander({
            controller: "PCF8574A",
            address: 0x38
        })
    );

    var extender1 = new five.Leds(
        Array.from({ length: 8 }, function (_, i) {
            return new five.Led({ pin: i, board: virtual1 });
        })
    );
    var extender2 = new five.Leds(
        Array.from({ length: 8 }, function (_, i) {
            return new five.Led({ pin: i, board: virtual2 });
        })
    );
    var extender3 = new five.Leds(
        Array.from({ length: 8 }, function (_, i) {
            return new five.Led({ pin: i, board: virtual3 });
        })
    );

    var button = new five.Button({
        pin: 0, // is GPIO182 on Intel Edison mini breakout board
        invert: true,
        holdtime: 1000
    });

    function nixie_disp(number, extender) {
        var n1 = number % 10;
        var n2 = (number - n1) / 10;
        var bcd_number = 16 * n2 + n1;
        for (var i = 0; i < 8; i++) {
            var bit = (bcd_number & (1 << i)) != 0;
            //console.log(i,number,bcd_number,bit);
            if (bit) {
                extender[i].on();
            } else {
                extender[i].off();
            }
        }
    }

    function showTime() {
        var date = new Date();
        var hour = date.getHours();
        var sec = date.getSeconds();
        var min = date.getMinutes();
        nixie_disp(sec, extender1);
        nixie_disp(min, extender2);
        nixie_disp(hour, extender3);
    }

    function showDate() {
        var date = new Date();
        var year = date.getYear() - 100;
        var month = date.getMonth() + 1;
        var day = date.getDate();
        nixie_disp(day, extender1);
        nixie_disp(month, extender2);
        nixie_disp(year, extender3);
    }

    function showDisplayFunction(num) {
        nixie_disp(num, extender1);
        nixie_disp(0, extender2);
        nixie_disp(0, extender3);
    }

    button.on("hold", function () {
        display_function += 1;
        if (display_function > MAXFUNCTION) {
            display_function = 0;
        }
        showDisplayFunction(display_function);
        switch_function = true;
    });

    button.on("press", function () {
        switch_function = true;
    });

    button.on("release", function () {
        setTimeout(function () {
            switch_function = false;
        }, 1000);
    });

    function showAll() {
        setInterval(function () {

            if (switch_function) {
                showDisplayFunction(display_function);
            } else {
                switch (display_function) {
                    case 0:
                        showTime();
                        break;
                    case 1:
                        showDate();
                        break;
                }
            }
        }, 500);
    }

    showAll();

});
