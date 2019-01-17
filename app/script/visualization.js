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

                var regionColors = [];
                var colors = ['#F23C50', '#FFCB05', '#16494F', '#4AD9D9', '#12F34A', '#E228C0'];
                DataProvider.getPreparedData().forEach(function (region, i) {
                    var data = DataProvider.getAverageForRegion(region.Region,'2016','22013');
                    regionColors[i]=new Array(region.Region,ColorScale('22013',data));
                    console.log(region.Region + "    " + data + "   "+ i);
                    /*if (data<5000)
                        regionColors[i]=new Array(region.Region,colors[0]);
                    else if (data<10000)
                        regionColors[i]=new Array(region.Region,colors[1]);
                    else if (data<15000)
                        regionColors[i]=new Array(region.Region,colors[3]);
                    else if (data<20000)
                        regionColors[i]=new Array(region.Region,colors[4]);
                    else if (data<100000)
                        regionColors[i]=new Array(region.Region,colors[5]);*/

                    //console.log(ColorScale('22013',data))
                });

                    
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
                        d3.selectAll('path')
                          .filter(function(d) { return d.properties.name != country})
                          .filter(function(d) { return d.properties.continent == cont})
                          .transition().duration(100)
                          .attr('opacity', 0.3);
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
                            var colorIndex = i % colors.length;
                            console.log(colorIndex)
                            console.log(d.properties.name);
                            countryColors[d.properties.name] = colors[colorIndex];
                            return colors[colorIndex];
                            });
                        break;
                    case"Continent":
                        view = "World";
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
                            if (d.properties.subregion == "South America")
                                d.properties.subregion = "Southern America"
                            var i;
                            for (i=0; i<regionColors.length; i++) {
                                if (regionColors[i][0] == d.properties.subregion) {
                                    return regionColors[i][1];
                                }
                            }
                            });

                        cont = null;
                        break;
                    default:
                        break;
                    }
                    hover = true;
                };
                    
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
                    /*switch(d.properties.continent){
                    case "Europe":
                    return colors[0];
                    case "Africa":
                        return colors[1];
                    case "North America":
                        return colors[2];
                    case "South America":
                        return colors[3];
                    case "Asia":
                        return colors[4];
                    case "Oceania":
                        return colors[5];
                    default:
                    return '#000000'
                    }*/
                    /*switch(d.properties.subregion){
                        case "Northern Africa":
                        return regionColors[8];
                        default:
                        return '#000000'
                        }*/
                        if (d.properties.subregion == "South America")
                            d.properties.subregion = "Southern America"
                        var i;
                        for (i=0; i<regionColors.length; i++) {
                            if (regionColors[i][0] == d.properties.subregion) {
                                return regionColors[i][1];
                            }
                        }
                        //console.log("no match found for "+ d.properties.subregion);
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
