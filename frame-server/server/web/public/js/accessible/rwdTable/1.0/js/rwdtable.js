/* Responsive table
 Author: Ponnamy Kiep, Angelo Cocci
 	 	 based on script by Maggie Wachs, www.filamentgroup.com
 Date: 09/14/12
 Last Update: 03/12/14
 Dependencies: jQuery, jQuery UI widget factory
 */

(function($) {
    $.widget("rwdtable.rwdtable", {

        options: {
            idprefix: "col-", // specify a prefix for the id/headers values
            persist: "persist", // specify a class assigned to column headers (th) that should always be present; the script not create a checkbox for these columns
            viewAllCss: "viewAllCss", // class selection for all the view all css to load in new window
            optionContainer: null, // container to hold the display options menu
            optionItemsContainer: null, // container element where the hide/show checkboxes will be inserted; if none specified, the script creates a menu
            optionDisplayButtonClass: null, // optional class for the display options button
            optionShowAllButtonClass: null, // optional class for the display options button
            optionDisplayText: "Columns to view", // text for display options button
            optionShowAllText: "Show full table in new window", // text for view full table button
            viewAllTitleText: "Full table view", // <title> for new window to view full table
            viewAllHeading: "Full table view" // <h1> for new window to view full table
        },

        // Set up the widget
        _create: function() {
            var self = this,
                o = self.options,
                table = self.element,
                tableID = table.attr("id"),
                thead = table.find("thead"),
                tbody = table.find("tbody"),
                hdrCols = thead.find("th"),
                bodyRows = tbody.find("tr"),
                container = $('<div id="' + tableID + '-optionItemsContainer" class="rwdtable-menu rwdtable-menu-hidden" aria-hidden="true" aria-expanded="false" aria-selected="false"><form><fieldset name="columnViewOptions"><legend>View columns <span class="sr-only">by selecting the appropriate checkboxes</span></legend><ul></fieldset></form></div>');
            optionContainer = $("#" + o.optionContainer),
                o.idprefix = tableID + "-" + o.idprefix;

            // Prepare the container if user supplied
            if (o.optionItemsContainer) {
                container.addClass("rwdtable-menu");
                container.addClass("rwdtable-menu-hidden");
                container.html("<ul/>");
            }

            // Add even/odd row classes for external control
            bodyRows.each(function(i, element) {
                if (i % 2 == 1) $(element).addClass("row-odd");
                else $(element).addClass("row-even");
            });

            $(document).click(function(e) {
                if (!$(e.target).is(container) && !$(e.target).is(container.find("*"))) {
                    if (!container.hasClass("rwdtable-menu-hidden")) container.toggleClass("rwdtable-menu-hidden");
                }
            });

            hdrCols.each(function(i) {
                var th = $(this),
                    id = th.attr("id"),
                    classes = th.attr("class");

                // assign an id to each header, if none is in the markup
                if (!id) {
                    id = (o.idprefix ? o.idprefix : tableID + "-col-") + i;
                    th.attr("id", id);
                };

                // assign matching "headers" attributes to the associated cells
                bodyRows.each(function() {
                    var cell = $(this).find("th, td").eq(i);
                    cell.attr("headers", id);
                    if (classes) {
                        cell.addClass(classes);
                    };
                });

                // create the hide/show toggles
                if (!th.is("." + o.persist)) {
                    var toggle = $('<li role="presentation"><div class="input-toggle"><input tabindex="0" type="checkbox" name="toggle-cols" id="' + tableID + '-toggle-col-' + i + '" value="' + id + '" /></div><div class="label-toggle"><label for="' + tableID + '-toggle-col-' + i + '">' + th.text() + '</label></div><div class="clear"></div></li>');

                    container.find("ul").append(toggle);

                    toggle.find("input").change(function() {
                        var input = $(this),
                            val = input.val(),
                            cols = $("#" + val + ", [headers=" + val + "]");

                        if (input.is(":checked")) {
                            cols.show();
                        } else {
                            cols.hide();
                        };
                    }).bind("updateCheck", function() {
                        if (th.css("display") == "table-cell" || th.css("display") == "inline") {
                            $(this).attr("checked", true);

                        } else {
                            $(this).attr("checked", false);
                        }
                    }).trigger("updateCheck");
                };

            });
            // end hdrCols loop

            // update the inputs' checked status
            $(window).bind("orientationchange resize", function() {
                container.find("input").trigger("updateCheck");

            });

            var menuWrapper = $('<div class="rwdtable-wrapper-menu" />'),
                menuBtn = $('<a href="javascript:void(0);" id="' + tableID + 'rwdtable-menu-button" aria-expanded="false" aria-controls="' + tableID + '-optionItemsContainer" class="' + o.optionDisplayButtonClass + ' rwdtable-menu-btn"><i class="fa fa-caret-down"><span class="adobeBlank">Expanded arrow icon</span><span class="sr-only">Expand</span></i> ' + o.optionDisplayText + '</a>');
            showBtn = $('<a href="javascript:void(0);" id="' + tableID + 'rwdtable-showall-button" class="' + o.optionShowAllButtonClass + ' rwdtable-all-btn"><i/> ' + o.optionShowAllText + '</a>'),

                // Display menu options handler
                menuBtn.click(function(event) {
                    container.toggleClass("rwdtable-menu-hidden");

                    // Update aria roles for container
                    if (container.hasClass("rwdtable-menu-hidden")) {
                        container.attr("aria-hidden", "true");
                        container.attr("aria-expanded", "false");
                        container.attr("aria-selected", "false");
                        menuBtn.attr("aria-expanded", "false");
                    } else {
                        container.attr("aria-hidden", "false");
                        container.attr("aria-expanded", "true");
                        container.attr("aria-selected", "true");
                        menuBtn.attr("aria-expanded", "true");
                    }

                    // Update accessibility hidden text for menuBtn
                    $(this).toggleClass("rwdtable-menu-active");
                    if ($(this).hasClass("rwdtable-menu-active")) {
                        $(this).children()
                            .html('<span class="adobeBlank">Collapse arrow icon</span><span class="sr-only">Collapse</span></i>')
                            .removeClass("fa-caret-down")
                            .addClass("fa-caret-up");
                    } else {
                        $(this).children()
                            .html('<span class="adobeBlank">Expanded arrow icon</span><span class="sr-only">Expand</span></i>')
                            .removeClass("fa-caret-up")
                            .addClass("fa-caret-down");
                    }

                    $("#" + tableID + "-toggle-col-0").focus();
                    event.preventDefault();
                    return false;
                });

            showBtn.click(function() {
                var head = $("<head>");

                if (!o.viewAllTitleText) head.append($("title").clone());
                else head.append("<title>" + o.viewAllTitleText + "</title>");

                head.append($(".viewAllCss").clone());
                viewContent(table, head);
            });

            //append buttons to container
            menuWrapper.append(menuBtn).append(container);
            menuWrapper.append(showBtn).append(container);

            if (!o.optionContainer) {
                table.parent().before(menuWrapper);
            } else {
                optionContainer.append(menuWrapper);
            }

            /* Generate dynamic HTML page in memory */
            viewContent = function(targ, head) {
                var newWindow = window.open(),
                    text = $(targ).parent().html(),
                    headHTML = $('<div>').append(head).clone().html();

                //output html to new page
                var html = "<html>";
                html += headHTML;
                html += "<body>";
                html += "<h1>" + o.viewAllHeading + "</h1>";
                html += "<div class='rwdtable-full'>";
                html += text;
                html += "</div></body></html>";

                //write content
                newWindow.document.open();
                newWindow.document.write(html);
                newWindow.document.close();
            }

        }, // end _create

        disable: function() {
            // TBD
        },

        enable: function() {
            // TBD
        }
    });

    /* Apply additional classes to rwd stacked tables */
    $.each($(".rwdtable-stack"), function() {
        $("td:first-child").addClass("first-child");
        $("td:last-child").addClass("last-child");
        $("tr").each(function(i, element) {
            if (i % 2 == 1) $(element).addClass("row-odd");
            else $(element).addClass("row-even");
        });
    });

    /* Update summaries for stacked tables on responsive breakpoint */

    var stackedTables = $("table.rwdtable-stack");
    var responsiveCheckTimeout;

    //TODO: Localize these
    var responsiveTableSummaryAddition = " - This table will change visual appearance depending on the size of your screen. Currently it is displayed as a vertical list due to the narrow screen size.";
    var nonResponsiveTableSummaryAddition = " - This table will change visual appearance depending on the size of your screen. Currently it is displayed as a regular table due to the wide screen size.";

    if (stackedTables.length) {
        handleResponsive();
        $(window).resize(function() {
            handleResponsive();
        });
    }

    function handleResponsive() {
        //Set and clear a long timeout to prevent this from happening unnecessarily on every single resize event 
        clearTimeout(responsiveCheckTimeout);
        responsiveCheckTimeout = setTimeout(function() {
            //Fetch tables again, in case tables were added or removed since load
            $("table.rwdtable-stack").each(function() {
                var $table = $(this);
                //remember original table summary, if provided
                if (!$table.data("originalSummary")) {
                    $table.data("originalSummary", $table.attr("summary"));
                }
                // display:block indicates table is currently rendered as a responsive table, other checks prevent redundantly changing summary to the same value 
                if ($table.css("display") == "block" && ($table.data("responsiveOn") === false || $table.data("responsiveOn") === undefined)) {
                    $table.data("responsiveOn", true);
                    //$($table).attr("summary", $table.data("originalSummary") + responsiveTableSummaryAddition)
                } else if ($table.css("display") == "table" && ($table.data("responsiveOn") === true || $table.data("responsiveOn") === undefined)) {
                    $table.data("responsiveOn", false);
                    //$($table).attr("summary", $table.data("originalSummary") + nonResponsiveTableSummaryAddition)
                }
            });
        }, 1000);
    }

}(jQuery));