/**
 * Visualization module
 */
var Visualization = function () {
    var _greeting;

    return {
        /**
         * Create the visualisation. This is the main application entry point.
         */
        /*draw: function () {
            var _greeting = '<pre>There are ' + DataProvider.getPreparedData().length + ' regions. ';
            DataProvider.getPreparedData().forEach(function (region) {
                _greeting += region.Region + ' has ' + region.Countries.length + ' countries.\n';
            });
            _greeting += 'By the way, Germany had ' + DataProvider.getValue('Germany', '2016', '21042') + ' percent of obese people in 2016.\n\n'
            _greeting += 'Northern Africa had an average index of ' + DataProvider.getAverageForRegion('Northern Africa', '2016', '21032') + ' for political stability in 2015,\n';
            _greeting += 'while Western Europe had ' + DataProvider.getAverageForRegion('Western Europe', '2016', '21032') + '. ';
            var bestIndex = DataProvider.getMaxValue('21032');
            _greeting += 'The best index was ' + bestIndex.Value + ' in ' + bestIndex.Country + ' in the year ' + bestIndex.Year + '.';
            _greeting += '</pre>';
            document.body.innerHTML = _greeting;
        }*/
        draw: function () {
            d3.json("data/geodata.json", function(error, data){
                var width  = window.innerWidth;
                var height = window.innerHeight;
                console.log("W: " + width + " / H: " + height);

                var svg = d3.select('body').append('svg');
                    
                var projection = d3.geoMercator().scale(175).translate([width/2, (height/2)+100]);
                    
                var path = d3.geoPath()
                .projection(projection);
                    
                var countryColors = {};
                var hover = true;
                var view = "World";
                var cont = "";

                function ColorScale(code, value) {
                    var myScale = d3.scaleLinear()
                    .domain([DataProvider.getMinValue(code).Value,DataProvider.getMaxValue(code).Value])
                    .range(['red','green']);
                    var ColorCode = myScale(value);
                    return ColorCode;
                }

                function ColorScaleYear(code, value, year) {
                    var myScale = d3.scaleLinear()
                    .domain([DataProvider.getMinValueYear(code, year).Value,DataProvider.getMaxValueYear(code, year).Value])
                    .range(['red','green']);          
                    var ColorCode = myScale(value);
                    //console.log("Looking up: "+value+" results in "+ColorCode);
                    return ColorCode;
                }

                function SizeScaleYear(code, value, year) {
                    var myScale = d3.scaleLinear()
                    .domain([DataProvider.getMinValueYear(code, year).Value,DataProvider.getMaxValueYear(code, year).Value])
                    .range([0,50]);          
                    var ColorCode = myScale(value);
                    return ColorCode;
                }

                var continentColors = [];
                var regionColors = [];
                var colors = ['#F23C50', '#FFCB05', '#16494F', '#4AD9D9', '#12F34A', '#E228C0'];

                var dataContinent = [0,0,0,0];
                //set colors for regions
                DataProvider.getPreparedData().forEach(function (region, i) {
                    var data = DataProvider.getAverageForRegion(region.Region,'2016','22013');
                    regionColors[i]=new Array(region.Region,ColorScaleYear('22013', data, '2016'));
                    if (region.Region.includes("Europe")) {
                        dataContinent[0] += data;
                    } else if (region.Region.includes("Africa")) {
                        dataContinent[1] += data;
                    } else if (region.Region == "Northern America") {
                        dataContinent[2] += data;
                    } else if (region.Region == "Southern America") {
                        dataContinent[3] += data;
                    }
                });
                for (i = 0; i<dataContinent.length;i++) {
                    continentColors[i]=ColorScaleYear('22013', dataContinent[i], '2016');
                }
                    
                function handleMouseOverContinent(continent, country) {
                    if(hover){
                      switch(view){
                      case"World":
                        d3.selectAll('path')
                          .filter(function(d) { return d.properties.continent != continent })
                          .transition().duration(100)
                          .attr('opacity', 0.3);
                        break;
                      case"Continent":
                        if (continent == cont){
                            d3.selectAll('path')
                            .filter(function(d) { return d.properties.name != country})
                            .filter(function(d) { return d.properties.continent == cont})
                            .transition().duration(100)
                            .attr('opacity', 0.3);

                            //define gradient for the circle diagram
                            var grad = svg.append("defs").append("linearGradient").attr("id", "grad")
                            .attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
                                grad.append("stop").attr("offset", "0%").style("stop-color", "black");
                                grad.append("stop").attr("offset", "0%").style("stop-color", "white");

                            svg.selectAll('circle')
                            .data(data.features)
                            .enter()
                            .filter(function(d) { return d.properties.name == country})
                            .append('circle')
                            .attr('r',function(d){ 
                                var tempData = SizeScaleYear('22013', DataProvider.getValuebyiso(d.properties.iso_a3,"2010","22013"), '2010');
                                if (tempData == false || tempData == undefined || tempData !== tempData) {
                                    tempData = 0;
                                }
                                return 20+tempData; 
                            })
                            .attr('cx', function(d) {
                                if (d.properties.name == country) {
                                    //console.log(d3.mouse(this)[0]);
                                    //console.log("RETURNING FOR X: "+path.centroid(d)[0])
                                    //return path.centroid(d)[0];
                                    return d3.mouse(this)[0]+40;
                                }
                            })
                            .attr('cy', function(d) {
                                if (d.properties.name == country) {
                                    // console.log("RETURNING FOR Y: "+path.centroid(d)[1])
                                    //console.log(data);
                                    //console.log(grad);
                                    //return path.centroid(d)[1];
                                    return d3.mouse(this)[1];
                                }
                            })
                            .attr('stroke','black')
                            .attr('fill', function(d,i) {
                                //dynamically change color of the circle diagram
                                var circleColor = ColorScaleYear('21032', DataProvider.getValuebyiso(d.properties.iso_a3,"2010","21032"), '2010');
                                var circlePercent;
                                var tempData = DataProvider.getValuebyiso(d.properties.iso_a3,"2010","210041");
                                if (tempData == "<2.5") {
                                    circlePercent = "2.5";
                                } else if (tempData == false || tempData == undefined)
                                {
                                    circlePercent = "100";

                                    svg.append("text")
                                    .attr("x", function(d){return d3.mouse(this)[0]+40;})
                                    .attr("y", function(d){return d3.mouse(this)[1]+5;})
                                    .attr("text-anchor", "middle") 
                                    .attr("font-weight", "bold")
                                    .style('fill', function(d){return circleColor;})
                                    .style("font-size", "18px")
                                    .text("n.a.");
                                } else {
                                    circlePercent = tempData;
                                }
                                //console.log(circlePercent);
                                d3.selectAll("stop")
                                    .attr("offset","0%")
                                    .transition()
                                    .style("stop-color", function(d,i) {
                                        if (i === 0) {
                                            return circleColor;
                                        }
                                        return "white";
                                    })
                                    .attr("offset", function(d,i) {
                                        return (100-parseInt(circlePercent)) + "%";
                                    });

                                return "url(#grad)";
                            })
                            }
                        
                        break;
                      default:
                        break;
                      }
                    }
                  }

                function handleMouseOutContinent() {
                if(hover){
                    switch(view){
                    case"World":
                        d3.selectAll('path')
                            .transition().duration(300)
                            .attr('opacity', 1);
                    break;
                    case"Continent":
                        d3.selectAll('path')
                            .filter(function(d) { return d.properties.continent == cont })
                            .transition().duration(300)
                            .attr('opacity', 1);

                        svg.selectAll('circle').remove();
                        svg.selectAll('text').remove();
                        break;
                    default:
                        break;
                    }
                }
                }
                
                function handleMouseClickContinent(continent) {
                    hover = false;
                    switch(view){
                    case"World":
                        // dont do anything if you just click the background
                        if (continent == undefined) return;

                        view = "Continent";
                        cont = continent;
                        // alle nicht angeklickten Kontinente ausblenden
                        d3.selectAll('path')
                            .filter(function(d) { return d.properties.continent != continent })
                                .transition().duration(300)
                            .attr('opacity', 0);
                        
                        // den angeklickten Kontinent hervorheben
                        var transformString = "";
                        switch(continent){
                        case"Europe":
                            //W: 1920 / H: 943
                            transformString = "translate(" + (-1.1458*width) + "," + (-0.6362*height) + ")scale(3)";
                            break;
                        case"North America":
                            transformString = "translate(-400,-400)scale(2)";
                            break;
                        case"South America":
                            transformString = "translate(-1000,-1200)scale(2.5)";
                            break;
                        case"Asia":
                            transformString = "translate(-2700,-1000)scale(3)";
                            break;
                        case"Africa":
                            transformString = "translate(-2100,-1200)scale(3)";
                            break;
                        case"Oceania":
                            transformString = "translate(-4700,-2100)scale(4)";
                            break;
                        default:
                            break;
                         }
                        d3.selectAll('path')
                            .filter(function(d) { return d.properties.continent == continent })
                            .transition().duration(300)
                            .attr("transform", transformString)
                            .attr('fill',  function(d, i) { 
                                return ColorScale ('21032', DataProvider.getValuebyiso(d.properties.iso_a3,"2010","21032"),2010);
                            });
                        break;
                    case"Continent":
                        view = "World";

                        // alle kreise entfernen
                        svg.selectAll('circle').remove();
                        svg.selectAll('text').remove();

                        // alle anderen Kontinente einblenden
                        d3.selectAll('path')
                            .filter(function(d) { return d.properties.continent != cont })
                                .transition().duration(300)
                            .attr('opacity', 1);
                        
                        // den angeklickten Kontinent normalisieren
                        var transformString = "";
                        switch(continent){
                        case"Europe":
                            transformString = "translate(" + (1.1458*width) + "," + (0.6362*height) + ")scale(1/3)";
                            break;
                        case"North America":
                            transformString = "translate(-50,+50)scale(1/1.6)";
                            break;
                        case"South America":
                            transformString = "translate(1000,1200)scale(1/2.5)";
                            break;
                        case"Asia":
                            transformString = "translate(1250,600)scale(1/3)";
                            break;
                        case"Africa":
                            transformString = "translate(2700,1000)scale(1/3)";
                            break;
                        case"Oceania":
                            transformString = "translate(4700,2100)scale(1/4)";
                            break;
                        default:
                            break;
                        }
                        d3.selectAll('path')
                            .filter(function(d) { return d.properties.continent == cont })
                            .transition().duration(300)
                            .attr("transform", transformString)
                            .attr('fill',  function(d, i) {
                                return ColorScale ('21032', DataProvider.getAverageForContinent(d.properties.continent,"2010","21032"),2010);
                            });
                        cont = null;
                        break;
                    default:
                        break;
                    }
                    hover = true;
                };

                // background rect for minimizing continents
                svg.append("rect")
                    .attr("class", "background")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("fill", "white")
                    .on("click", handleMouseClickContinent);
                    
                svg.selectAll('path')
                .data(data.features)
                .enter()
                .append('path')
                .attr('d', function(d) { 
                    return path(d)
                    })
                .attr('data-country', function(d) { 
                    return d.properties.name;
                    })
                .attr('fill',  function(d, i) {
                    return ColorScale ('21032', DataProvider.getAverageForContinent(d.properties.continent,"2010","21032"),2010);
                })
                .on("mouseover", function(d, i) {
                    handleMouseOverContinent(d.properties.continent, d.properties.name);
                })
                .on("mouseout", function(d, i) {
                    handleMouseOutContinent(d.properties.continent);
                })
                .on("click", function(d, i) {
                    handleMouseClickContinent(d.properties.continent);
                    });
            })
            
        }
    }
}(); 
