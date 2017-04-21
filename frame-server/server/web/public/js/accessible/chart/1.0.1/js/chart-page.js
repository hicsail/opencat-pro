window.onload = function() {
    function legend(parent, data) {
        parent.className = 'legend';
        var datas = data.hasOwnProperty('datasets') ? data.datasets : data;

        // remove possible children of the parent
        while (parent.hasChildNodes()) {
            parent.removeChild(parent.lastChild);
        }

        datas.forEach(function(d) {
            var title = document.createElement('span');
            title.className = 'title';
            title.style.borderColor = d.hasOwnProperty('strokeColor') ? d.strokeColor : d.color;
            title.style.borderStyle = 'solid';
            parent.appendChild(title);

            var text = document.createTextNode(d.title);
            title.appendChild(text);
        });
    }

    (function() {
        var t;

        function size(animate) {
            if (animate == undefined) {
                animate = false;
            }
            clearTimeout(t);
            t = setTimeout(function() {
                $("canvas").each(function(i, el) {
                    $(el).attr({
                        "width": $(el).parent().width(),
                        "height": $(el).parent().outerHeight()
                    });
                });
                redraw(animate);
                var m = 0;
                $(".charts-area").height("");
                $(".charts-area").each(function(i, el) {
                    m = Math.max(m, $(el).height());
                });
                $(".charts-area").height(m);
            }, 30);
        }
        $(window).on('resize', function() {
            size(false);
        });

        function redraw(animation) {
            var options = {};
            if (!animation) {
                options.animation = false;
            } else {
                options.animation = true;
            }

            barChart(options);
            lineChart(options);
            pieChart(options);

        }

        function barChart(options) {
            var data = {
                labels: ["January", "February", "March", "April", "May", "June", "July"],
                xAxisLabel: "Month",
                yAxisLabel: "Population",
                datasets: [{
                    //Blue
                    fillColor: "#000099",
                    strokeColor: "rgba(0,0,153,1)",
                    data: [65, 59, 90, 81, 56, 55, 40],
                    title: 'Tigers'
                }, {
                    //Red
                    fillColor: "#FF0000",
                    strokeColor: "#FF0000",
                    data: [28, 48, 40, 19, 96, 27, 100],
                    title: 'Bears'
                }]
            };
            var canvas = document.getElementById("barChart");
            var ctx = canvas.getContext("2d");
            new Chart(ctx).Bar(data, options);

            legend(document.getElementById("barLegend"), data);

        };

        function lineChart(options) {
            var data = {
                labels: ["January", "February", "March", "April", "May", "June", "July"],
                xAxisLabel: "Month",
                yAxisLabel: "Population",
                datasets: [{
                    //Blue
                    fillColor: "#000099",
                    strokeColor: "#000099",
                    pointColor: "#000099",
                    pointStrokeColor: "#fff",
                    data: [65, 59, 90, 81, 56, 55, 40],
                    title: 'Tigers'
                }, {
                    //Red
                    strokeColor: "#FF0000",
                    fillColor: "#FF0000",
                    pointColor: "#FF0000",
                    pointStrokeColor: "#fff",
                    data: [28, 48, 40, 19, 96, 27, 100],
                    title: 'Bears'
                }]
            };
            var canvas = document.getElementById("lineChart");
            var ctx = canvas.getContext("2d");
            new Chart(ctx).Line(data, options);

            legend(document.getElementById("lineLegend"), data);
        };

        function pieChart(options) {
            var data = [{
                value: 30,
                color: "#FF0000",
                title: 'Bears'
            }, {
                value: 50,
                color: "#000099",
                title: 'Lynxes'
            }, {
                value: 100,
                color: "#808080",
                title: 'Reindeer'
            }];
            var canvas = document.getElementById("pieChart");
            var ctx = canvas.getContext("2d");
            new Chart(ctx).Pie(data, options);

            legend(document.getElementById("pieLegend"), data);
        };

        size(true);
    }());
};