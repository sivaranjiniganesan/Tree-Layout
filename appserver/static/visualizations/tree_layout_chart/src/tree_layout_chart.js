define([
        'jquery',
        'underscore',
        'api/SplunkVisualizationBase',
        'api/SplunkVisualizationUtils',
        'd3'
    ],
    function(
        $,
        _,
        SplunkVisualizationBase,
        vizUtils,
        d3
    ) {


        var DEFAULT_WIDTH = 900,
            DEFAULT_HEIGHT = 500,
            LEGEND_WIDTH = 145,
            MSG_AREA_HEIGHT = 20;

        var MARGIN = {
            top: 18,
            right: 15,
            bottom: 15,
            left: 15
        };
        console.log("i m in")
        $(document).on('click', ".node text", function() {
            setTimeout(function() {
                UI_width = $('.ui-resizable')[0].getBoundingClientRect().width
                G_width = $('.first_g')[0].getBoundingClientRect().width + 120
                click_width = parseInt($(".svg-class").css("width").replace("px", ""))
                new_width = parseInt($('.first_g').css('transform').split(',')[4])
                change_width = (click_width / 2) - 50
                console.log("G_width " + G_width + "UI_width " + UI_width)
                if (G_width > UI_width) {
                    console.log("in if")
                    $(".svg-div").css("overflow-x", "scroll")
                    width_new = UI_width + (G_width - UI_width) + 200
                    $(".svg-class").css("width", width_new + "px")
                } else {
                    console.log("in else")
                    $(".svg-class").css("width", UI_width + "px")
                    $(".svg-div").css("overflow-x", "hidden")
                }
            }, 500);
        });
        var error_finder = true
        return SplunkVisualizationBase.extend({

            initialize: function() {
                this.$el = $(this.el);
                this.$el.addClass('splunk-tree-layout');
            },

            getInitialDataParams: function() {
                return ({
                    outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                    count: 10000
                });
            },

            formatData: function(data, config) {
                if (data.rows.length == 0) {
                    error_finder = false
                    return;
                }
                error_finder = true
                var root_main = {}
                //console.log(data)
                root = {
                    "name": data.rows[0][0].split("||")[0]
                }

                for (var i = 0; i < data.rows.length; i++) {
                    row_array = data.rows[i][0].split("||")
                    for (var j = 1; j < row_array.length; j++) {
                        position = findPosition(row_array, j)
                        if (position != true) {
                            assignvaluee(root, position, {
                                "name": row_array[j]
                            });
                            //console.log(root)
                            Object.assign(root_main, root)
                        }
                    }
                }

                function assignvaluee(obj, keyPath, assignvalue) {
                    lastKeyIndex = keyPath.length - 1;
                    for (var assi = 0; assi < lastKeyIndex; ++assi) {
                        key = keyPath[assi];
                        if (!(key in obj)) {
                            if (key == "children")
                                obj[key] = []
                            else
                                obj[key] = {}
                        }
                        obj = obj[key];
                    }
                    if (obj[keyPath[lastKeyIndex]] != undefined)
                        obj[keyPath[lastKeyIndex]] = Object.assign(obj[keyPath[lastKeyIndex]], assignvalue)
                    else
                        obj[keyPath[lastKeyIndex]] = assignvalue
                }

                function findPosition(value, depth) {
                    position_skip = false
                    first_time = false
                    root_check = root
                    for (var find_check = 1; find_check <= depth; find_check++) {

                        if ((root_check.hasOwnProperty("children"))) {
                            root_check = root_check.children
                            for (var check = 0; check < Object.keys(root_check).length; check++) {
                                if (root_check[check].name == value[depth])
                                    position_skip = true
                            }
                        }
                    }
                    if (position_skip != true) {
                        var position = []
                        if (!(root.hasOwnProperty("children"))) {
                            return ["children", 0]
                        } else if (depth == 1) {

                            return ["children", Object.keys(root.children).length]
                        } else {
                            find_node = 0
                            root_copy = root
                            for (var find = 1; find < depth; find++) {
                                if (fj == undefined)
                                    root_copy = root_copy.children
                                else
                                    root_copy = root_copy[fj].children
                                position.push("children")
                                for (var fj = 0; fj < Object.keys(root_copy).length; fj++) {
                                    if (root_copy[fj].name == value[find]) {
                                        position.push(fj)
                                        find_node = fj
                                        break;
                                    }
                                }
                            }

                            if (root_copy[find_node].hasOwnProperty("children")) {
                                root_check = root_copy[find_node].children
                                for (var check1 = 0; check1 < Object.keys(root_check).length; check1++) {
                                    if (root_check[check1].name == value[depth])
                                        position_skip = true
                                }
                                if (position_skip != true) {
                                    position.push("children", Object.keys(root_copy[find_node].children).length)
                                }
                            } else
                                position.push("children", 0)
                            if (position_skip != true)
                                return position
                            else
                                return position_skip
                        }
                    } else
                        return position_skip
                }

                return root;
            },

            updateView: function(data, config) {
                level = [], level_label = []
                if ($(".ui-resizable").length)
                    default_width = $('.ui-resizable')[0].getBoundingClientRect().width
                // this.caption = vizUtils.normalizeBoolean(this._getEscapedProperty('caption', config) || " ");
                // this.backgroundColor = vizUtils.normalizeBoolean(this._getEscapedProperty('backgroundColor', config), { default: true });
                this.background = this._getEscapedProperty('background', config) || "color";
                cap_label = this._getEscapedProperty('label', config) || "";
                this.background_color = this._getEscapedProperty('background_color', config) || '#bed9ea';
                label_yaxis = this._getEscapedProperty('label_yaxis', config) || '100,300,460,700,1040';
                //caption_need = this._getEscapedProperty('caption_need', config) || 'no';
                text_color = this._getEscapedProperty('text_color', config) || '#000000';
                node_color = this._getEscapedProperty('node_color', config) || '#b1c3da';
                htext_color = this._getEscapedProperty('htext_color', config) || '#0ba207';
                link_color = this._getEscapedProperty('link_color', config) || '#000000';
                this.background_url = this._getEscapedProperty('background_url', config) || "https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQ37vpJNfOcxtO39i0gfBIQ9pI_WaVkqshWc8Shttl6iMts_MJA";
                this.width = this._getEscapedProperty('width', config) || 1000;
                this.height = this._getEscapedProperty('height', config) || 700;
                this.linklength = this._getEscapedProperty('linklength', config) || "15,25,35,45,55";
                //this.maxCategories = stringToInt(this._getEscapedProperty('maxCategories', config), 10);
                // this.backgroundColor = this._getEscapedProperty('backgroundColor', config) || '#e1e6eb');
                link_length = this.linklength.split(",")
                level_label = cap_label.split(",")
                label_yaxis = label_yaxis.split(",")
                mod_height = parseInt(this.height) + 100
                height_element = "height: " + mod_height + "px !important"
                if ($(".viz").length)
                    $(".viz .panel-body .splunk-view .ui-resizable").attr('style', height_element);
                else
                    $(".ui-resizable").attr('style', height_element);
                var w = 960,
                    h = 650,
                    i = 0,
                    duration = 500

                if (!error_finder) {
                    return;
                }
                if (this.background == "color")
                    background_option = this.background_color
                else
                    background_option = 'url(' + this.background_url + ')'
                //console.log("background_option "+background_option)
                this.$el.empty();
                var margin = {
                        top: 70,
                        right: 120,
                        bottom: 20,
                        left: 120
                    },
                    width = this.width
                height = this.height
                val1 = margin.left
                val2 = margin.top

                var i = 0,
                    duration = 750


                var tree = d3.layout.tree()

                    .size([height, width - 160]);

                var diagonal = d3.svg.diagonal()
                    .projection(function(d) {
                        //console.log(d.y +" "+d.x)
                        return [d.y, d.x];
                    });

                d3.select(this.el).append("div")
                    .attr('class', 'svg-div');

                /*
                 */
                var vis = d3.selectAll(".svg-div").append("svg")
                    .attr("width", default_width + "px")
                    .attr("height", mod_height + "px")
                    .attr('class', 'svg-class')
                    /*.call(d3.behavior.drag()
                        .on('drag', redraw))*/
                    .append("svg:g")
                    .attr("class", "first_g")
                    .attr("preserveAspectRatio", "none")
                    .attr("viewBox", "0 0 500 500")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                d3.select(".svg-class").style("background", background_option);
                d3.select(".svg-class").style("background-size", '100%');
                d3.select(".svg-class").style("background-repeat", 'no-repeat');
                //d3.select(".svg-class").style("background", this.backgroundColor);
                root.x0 = 500;
                root.y0 = 100;

                function collapse(d) {
                    if (d.children) {
                        d._children = d.children;
                        d._children.forEach(collapse);
                        d.children = null;
                    }
                }

                root.children.forEach(collapse);

                update(root);

                function update(source) {

                    // Compute the new tree layout.
                    var nodes = tree.nodes(root).reverse();
                    links = tree.links(nodes);
                    // Normalize for fixed-depth.
                    nodes.forEach(function(d) {});
                    nodes.forEach(function(d) {
                        d.y = link_length[d.depth] * 20;
                    });

                    if (cap_label != "") {
                        var depthHash = _.uniq(_.pluck(nodes, "depth")).sort();
                        //console.log("depthHash", depthHash)
                        vis.selectAll("g.levels-svg").remove();
                        var levelSVG = vis.append("g").attr("class", "levels-svg");
                        var levels = levelSVG.selectAll("g.level");
                        levels.data(depthHash)
                            .enter().append("g")
                            .attr("class", "level")
                            .attr("transform", function(d) {
                                return "translate(" + label_yaxis[d] + "," + -50 + ")";
                            })
                            .append("rect")
                            .attr("width", 110)
                            .attr("height", 35)
                            .attr("stroke", "black")
                            .attr("stroke-width", 1)
                            .style("fill", node_color);


                        var textt = d3.selectAll(".levels-svg,.level")
                        textt.append("text")
                            .attr("x", 55)
                            .attr("y", 15)
                            .attr("dy", ".35em")
                            .attr("text-anchor", "middle")
                            .text(function(d) {
                                return level_label[d];
                            })
                            .style("fill", text_color);
                    }


                    // Update the nodes…
                    var node = vis.selectAll("g.node")
                        .data(nodes, function(d) {
                            return d.id || (d.id = ++i);
                        });

                    var nodeEnter = node.enter().append("svg:g")
                        .attr("class", function(d) {
                            child_node = "node " + d.name
                            parent_node = d
                            count = 0, count_final = 0
                            while (parent_node.hasOwnProperty('parent')) {

                                child_node = child_node + "_" + parent_node.parent.name
                                parent_node = parent_node.parent
                                count++
                            }
                            count_final = count
                            child_node = child_node + "_" + count
                            return child_node

                        })
                        .attr("transform", function(d) {
                            return "translate(" + source.y0 + "," + source.x0 + ")";
                        })
                        .on('click', click);

                    // Enter any new nodes at the parent's previous position.


                    nodeEnter.append("circle")
                        .attr('class', 'nodeCircle')
                        .attr("r", 0)
                        .style("fill", function(d) {
                            return d._children ? node_color : "#fff";
                        });

                    nodeEnter.append("text")
                        .attr("x", function(d) {
                            return d._children ? -8 : 8;
                        })
                        .attr("y", function(d) {
                            return d.children ? -5 : 5;
                        })
                        .attr("dy", "0em")
                        .text(function(d) {
                            return d.name;
                        });


                    // wrap(d3.selectAll('text'), 10);

                    // Transition nodes to their new position.
                    // Update the text to reflect whether node has children or not.
                    node.select('text')
                        .attr("x", function(d) {
                            return d.children || d._children ? 10 : 10;
                        })
                        .attr("y", function(d) {
                            return d.children ? -5 : 5;
                        })
                        .text(function(d) {
                            return d.name;
                        })
                        .style("fill", function(d) {
                            return d.children ? htext_color : text_color;
                        });;

                    // Change the circle fill depending on whether it has children and is collapsed
                    node.select("circle.nodeCircle")
                        .attr("r", 4.5)
                        .style("fill", function(d) {
                            return d._children ? node_color : "#fff";
                        });

                    // Transition nodes to their new position.
                    var nodeUpdate = node.transition()
                        .duration(duration)
                        .attr("transform", function(d) {

                            return "translate(" + d.y + "," + d.x + ")";
                        });

                    // Fade the text in
                    nodeUpdate.select("text")
                        .style("fill-opacity", 1);

                    // Transition exiting nodes to the parent's new position.
                    var nodeExit = node.exit().transition()
                        .duration(duration)
                        .attr("transform", function(d) {
                            return "translate(" + source.y + "," + source.x + ")";
                        })
                        .remove();

                    nodeExit.select("circle")
                        .attr("r", 0);

                    nodeExit.select("text")
                        .style("fill-opacity", 0);


                    // Update the links…
                    var link = vis.selectAll("path.link")
                        .data(tree.links(nodes), function(d) {

                            return d.target.id;
                        });

                    // Enter any new links at the parent's previous position.
                    link.enter().insert("svg:path", "g")
                        .attr("class", "link")
                        .attr("stroke", link_color)
                        .attr("d", function(d) {

                            var o = {
                                x: source.x0,
                                y: source.y0
                            };
                            return diagonal({
                                source: o,
                                target: o
                            });
                        })


                    // Transition links to their new position.
                    link.transition()
                        .duration(duration)
                        .attr("d", diagonal);

                    // Transition exiting nodes to the parent's new position.
                    link.exit().transition()
                        .duration(duration)
                        .attr("d", function(d) {
                            var o = {
                                x: source.x,
                                y: source.y
                            };
                            return diagonal({
                                source: o,
                                target: o
                            });
                        })
                        .remove();

                    // Stash the old positions for transition.
                    nodes.forEach(function(d) {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });


                }




                // Toggle children on click.
                function click(d) {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }
                    // If the node has a parent, then collapse its child nodes
                    // except for this clicked node.
                    if (d.parent) {
                        d.parent.children.forEach(function(element) {
                            if (d !== element) {
                                collapse(element);
                            }
                        });
                    }

                    update(d);
                }

                function wrap(text, width) {
                    text.each(function() {
                        var text = d3.select(this),
                            words = text.text().split(/\s+/).reverse(),
                            word,
                            line = [],
                            lineNumber = 0,
                            lineHeight = 1.1, // ems
                            y = text.attr("y"),
                            dy = parseFloat(text.attr("dy")),
                            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                        while (word = words.pop()) {
                            line.push(word);
                            tspan.text(line.join(" "));
                            if (tspan.node().getComputedTextLength() > width) {
                                line.pop();
                                tspan.text(line.join(" "));
                                line = [word];
                                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                            }
                        }
                        d3.select(this.parentNode.children[0]).attr('height', 19 * (lineNumber + 1));

                    });
                }

                function redraw() {
                    UI_width = $('.ui-resizable')[0].getBoundingClientRect().width
                    G_width = $('.first_g')[0].getBoundingClientRect().width
                    new_width = parseInt($('.first_g').css('transform').split(',')[4])
                    redraw_width = parseInt($(".svg-class").css("width").replace("px", ""))
                    change_width = (redraw_width / 2) - 50
                    //  console.log("change_width ===="+change_width+val1)
                    /* if(val1 > change_width){
                             new_val1 = val1 - change_width
                          //  console.log("chan "+(new_val1+redraw_width)+"px")
                             $(".svg-class").css("width",(new_val1+redraw_width)+"px")
                             $(".svg-div").scrollLeft()
                     }
                                                             else */
                    if ((G_width + new_width + 100) > UI_width) {
                        console.log("in if")
                        $(".svg-div").css("overflow-x", "scroll")
                        width_new = UI_width + ((G_width + new_width + 100) - UI_width) + 200
                        $(".svg-class").css("width", width_new + "px")
                    } else if (new_width < -90) {
                        console.log("in else if")
                        $(".svg-div").css("overflow-x", "scroll")
                        /*width_new = UI_width + ((G_width+new_width+100) - UI_width)+200
                        $(".svg-class").css("width",width_new+"px")*/
                        $(".svg-div").scrollLeft(1000)
                    }


                    val1 += d3.event.dx
                    val2 += d3.event.dy
                    /*if (val2 > 0)
                        default_height_svg = mod_height + val2 + "px"
                    else
                        default_height_svg = mod_height
                    console.log("default_height_svg" + default_height_svg)
                    $(".svg-class").css("height", default_height_svg)
                    const wrapper = d3.select('.svg-class').node();*/
                    // console.log("val1 " + val1 + "val2 " + val2)
                    /*if (val1 > 0)
                        $(".svg-div").scrollLeft(val1)
                    else
                        $(".svg-div").scrollLeft(-(val1))
                    if (val1 > 0)
                        $(".svg-div").scrollTop(val2)
                    else
                        $(".svg-div").scrollTop(-(val2))*/
                    //$(".svg-div").scrollTop(val2)
                    //$(".svg-div").css("height",default_height_svg)
                    vis.attr("transform", `translate(${val1}, ${val2})`);

                }

            },

            _drilldown: function() {
                var data = this.getCurrentData();

                var payload = {
                    action: SplunkVisualizationBase.FIELD_VALUE_DRILLDOWN,
                    data: {}
                };
                payload.data[data.field] = data.datum;
                this.drilldown(payload);
            },

            _isEnabledDrilldown: function(config) {
                if (config['display.visualizations.custom.drilldown'] && config['display.visualizations.custom.drilldown'] === 'all') {
                    return true;
                }
                return false;
            },



            _getEscapedProperty: function(name, config) {
                var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
                return vizUtils.escapeHtml(propertyValue);
            }

        });
    });
