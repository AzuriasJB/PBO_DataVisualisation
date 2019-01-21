/**
 * Visualization module
 */
var Visualization = function () {
    var _greeting;

    return {
        /**
         * Create the visualisation. This is the main application entry point.
         */
        draw: function () {
            d3.json("data/geodata.json", function(error, data){
                var dataTime = d3.range(0, 17).map(function(d) {
                    return new Date(2000 + d, 10, 3);
                });
                var year = "2010";
                var min = d3.min(dataTime);
                var max = d3.max(dataTime);

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
                    var data = DataProvider.getAverageForRegion(region.Region,year,'22013');
                    regionColors[i]=new Array(region.Region,ColorScaleYear('22013', data, year));
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
                    continentColors[i]=ColorScaleYear('22013', dataContinent[i], year);
                }
                    
                function handleMouseOver(continent, country) {
                    if(hover){
                        switch(view){
                        case"World":
                            svg.selectAll('path')
                            .filter(function(d) { return d.properties.continent != continent })
                            .transition().duration(100)
                            .attr('opacity', 0.3);
                        break;
                        case"Continent":
                            if (continent == cont){
                                svg.selectAll('path')
                                .filter(function(d) { return d.properties.name != country})
                                .filter(function(d) { return d.properties.continent == cont})
                                .transition().duration(100)
                                .attr('opacity', 0.3);

                                //define gradient for the circle diagram
                                var grad = svg.append("defs").append("linearGradient").attr("id", "grad")
                                .attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
                                    grad.append("stop").attr("offset", "0%").style("stop-color", "black");
                                    grad.append("stop").attr("offset", "0%").style("stop-color", "white");

                                // define "Schraffur" for "n.a." in the circle diagram
                                svg.select("defs")
                                    .append("pattern")
                                        .attr("id", "diagonalSchraffur")
                                        .attr("patternUnits", "userSpaceOnUse")
                                        .attr("width", "10")
                                        .attr("height", "10")
                                    .append("image")
                                        .attr("href", "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2dyZXknIHN0cm9rZS13aWR0aD0nMScvPgo8L3N2Zz4K")
                                        .attr("x", "0")
                                        .attr("y", "0")
                                        .attr("width", "10")
                                        .attr("height", "10");

                                svg.selectAll('circle')
                                .data(data.features)
                                .enter()
                                .filter(function(d) { return d.properties.name == country})
                                .append('circle')
                                .attr('r',function(d){ 
                                    var tempData = SizeScaleYear('22013', DataProvider.getValuebyiso(d.properties.iso_a3,year,"22013"), year);
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
                                        var tempData = SizeScaleYear('22013', DataProvider.getValuebyiso(d.properties.iso_a3,year,"22013"), year);
                                        if (tempData == false || tempData == undefined || tempData !== tempData) {
                                            tempData = 0;
                                        }
                                        return d3.mouse(this)[0]+40+tempData;
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
                                    var circleColor = ColorScaleYear('21032', DataProvider.getValuebyiso(d.properties.iso_a3,year,"21032"), year);
                                    var circlePercent;
                                    var tempData = DataProvider.getValuebyiso(d.properties.iso_a3,year,"210041");
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

                                        return "url(#diagonalSchraffur)";
                                    } else {
                                        circlePercent = tempData;
                                    }
                                    //console.log(circlePercent);
                                    svg.selectAll("stop")
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
                                });

                                svg.append("text")
                                .attr("x", function(d){return d3.mouse(this)[0]+40;})
                                .attr("y", function(d){return d3.mouse(this)[1]-40;})
                                .attr("font-weight", "bold")
                                .attr("text-anchor", "middle")
                                .style('fill', "black")
                                .style("font-size", "18px")
                                .text(country);
                            }
                        
                        break;
                      default:
                        break;
                      }
                    }
                  }

                function handleMouseOut() {
                    if(hover){
                        switch(view){
                        case"World":
                            svg.selectAll('path')
                                .transition().duration(300)
                                .attr('opacity', 1);
                        break;
                        case"Continent":
                            svg.selectAll('path')
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
                
                function handleMouseClick(continent) {
                    hover = false;
                    switch(view){
                    case"World":
                        // dont do anything if you just click the background
                        if (continent == undefined) return;

                        view = "Continent";
                        cont = continent;
                        // alle nicht angeklickten Kontinente ausblenden
                        svg.selectAll('path')
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
                            transformString = "translate(" + (-0.2083*width) + "," + (-0.4241*height) + ")scale(2)";
                            break;
                        case"South America":
                            transformString = "translate(" + (-0.5208*width) + "," + (-1.2725*height) + ")scale(2.5)";
                            break;
                        case"Asia":
                            transformString = "translate(" + (-1.4062*width) + "," + (-1.0604*height) + ")scale(3)";
                            break;
                        case"Africa":
                            transformString = "translate(" + (-1.0937*width) + "," + (-1.2725*height) + ")scale(3)";
                            break;
                        case"Oceania":
                            transformString = "translate(" + (-2.4479*width) + "," + (-2.2269*height) + ")scale(4)";
                            break;
                        default:
                            break;
                        }
                        //console.log(transformString);
                        svg.selectAll('path')
                            .filter(function(d) { return d.properties.continent == continent })
                            .transition().duration(300)
                            .attr("transform", transformString)
                            .attr('fill',  function(d, i) { 
                                return ColorScaleYear ('21032', DataProvider.getValuebyiso(d.properties.iso_a3,year,"21032"),year);
                            });
                        break;
                    case"Continent":
                        view = "World";

                        // alle kreise entfernen
                        svg.selectAll('circle').remove();
                        svg.selectAll('text').remove();

                        // alle anderen Kontinente einblenden
                        svg.selectAll('path')
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
                            transformString = "translate(" + (0.2083*width) + "," + (0.4241*height) + ")scale(1/2)";
                            break;
                        case"South America":
                            transformString = "translate(" + (0.5208*width) + "," + (1.2725*height) + ")scale(1/2.5)";
                            break;
                        case"Asia":
                            transformString = "translate(" + (1.4062*width) + "," + (1.0604*height) + ")scale(1/3)";
                            break;
                        case"Africa":
                            transformString = "translate(" + (1.0937*width) + "," + (1.2725*height) + ")scale(1/3)";;
                            break;
                        case"Oceania":
                            transformString = "translate(" + (2.4479*width) + "," + (2.2269*height) + ")scale(1/4)";
                            break;
                        default:
                            break;
                        }
                        svg.selectAll('path')
                            .filter(function(d) { return d.properties.continent == cont })
                            .transition().duration(300)
                            .attr("transform", transformString)
                            .attr('fill',  function(d, i) {
                                return ColorScaleYear ('21032', DataProvider.getAverageForRegion(d.properties.subregion,"2010","21032"),year);
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
                    .on("click", handleMouseClick);
                    
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
                    return ColorScaleYear('21032', DataProvider.getAverageForRegion(d.properties.subregion,year,"21032"),year);
                })
                .on("mouseover", function(d, i) {
                    handleMouseOver(d.properties.continent, d.properties.name);
                })
                .on("mouseout", function(d, i) {
                    handleMouseOut(d.properties.continent);
                })
                .on("click", function(d, i) {
                    handleMouseClick(d.properties.continent);
                    });

                var sliderTime = d3.sliderBottom()
                .min(min)
                .max(max)
                .step(1000 * 60 * 60 * 24 * 365)
                .width(600)
                .tickFormat(d3.timeFormat('%Y'))
                .tickValues(dataTime)
                .default(new Date(year, 10, 3))
                .on("end", val => {
                    year = d3.timeFormat('%Y')(val);
                    console.log("New Year is: " + year);
                    svg.selectAll('path')
                    .attr('fill',  function(d, i) {
                        if (year == "2001") {
                            return "rgb(150,150,150)";
                        }
                        if (view=="World") {
                            return ColorScaleYear ('21032', DataProvider.getAverageForContinent(d.properties.continent,year,"21032"),year);
                        } else if (view=="Continent") {
                            return ColorScaleYear ('21032', DataProvider.getValuebyiso(d.properties.iso_a3,year,"21032"),year);
                        }
                    });
                    //drawGeodata();
                });

                var gTime = d3
                    .select('div#slider')
                    .append('svg')
                    .append('g')
                    .attr('transform', 'translate(30,30)');

                gTime.call(sliderTime);
            })
            
        }
    }
}(); 
