<template>
  <div id="app">
    <div class="container">
      <div class="svg_container">
        <svg></svg>
      </div>

      <div class="sidebar_container">
        <svg></svg>
      </div>

      <div class="slider_container">
        <div id="slider"></div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */ 
import * as d3 from "d3";
import { DataProvider } from "./script/dataprovider";
import * as slider from "d3-simple-slider";
import _data from "./data/geodata";
export default {
  name: 'App',
  data() {
    return {
      dataTime: null,
      year : "2010",
      min : null,
      max : null,
      svg: null,
      sidebar : null,
      width  : 0,
      height : 0,
      sidebarWidth : null,
      projection : null,
      path : null,
      fontSize : 18,
      circleOffset : 0,
      hover : true,
      view : "World",
      cont : "",
      CompareList : [],
    }
  },
  mounted: function() {
    this.init();
    this.drawMap();
    this.drawSlider();
  },
  methods: {
    init() {
      this.width=window.innerWidth;
      this.height=window.innerHeight;
      console.log(this.width+" " + this.height);
      this.svg = d3.select("#app").select('svg');
      this.sidebar = d3.select("#app").select('.sidebar_container').select('svg');
      this.projection = d3.geoMercator().scale(175).translate([(this.width/2)-200, (this.height/2)+100]);
      this.sidebarWidth = this.sidebar.node().getBoundingClientRect().width;
      this.dataTime = d3.range(0, 17).map(function(d) {
        return new Date(2000 + d, 10, 3);
      });
      this.min = d3.min(this.dataTime);
      this.max = d3.max(this.dataTime);
    },
    drawMap() {
      var that = this;
      var path = d3.geoPath().projection(this.projection);

      // background rect for select continents 
      that.svg.append("rect")
        .attr("class", "background")
        .attr("width", that.width)
        .attr("height", that.height)
        .attr("fill", "white")
        .on("click", function(d, i) {
            that.handleMouseClick();
        });

      this.svg.selectAll('path')
      .data(_data.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('data-country', function(d) { 
          return d.properties.name;
          })
      .attr('fill',  function(d, i) {
        return that.ColorScaleYear('21032', DataProvider.getAverageForRegion(d.properties.subregion,that.year,"21032"),that.year);
      })
      .on("mouseover", function(d, i) {
        that.handleMouseOver(d.properties.continent, d.properties.name);
      })
      .on("mouseout", function(d, i) {
        that.handleMouseOut(d.properties.continent);
      })
      .on("click", function(d, i) {
        that.handleMouseClick(d.properties.continent, d.properties.iso_a3);
      });
    },
    drawSlider(){
        var that = this;
        var sliderTime = slider.sliderBottom()
            .min(that.min)
            .max(that.max)
            .step(1000 * 60 * 60 * 24 * 365)
            .width(600)
            .tickFormat(d3.timeFormat('%Y'))
            .tickValues(that.dataTime)
            .default(new Date(that.year, 10, 3))
            .on("end", val => {
                that.year = d3.timeFormat('%Y')(val);
                console.log("New Year is: " + that.year);
                //immer alles außer den aktuellen Kontinent in Regionen einfärben
                //bei World view ist cont == null, es wird also alles in Regionen eingefärbe
                that.svg.selectAll('path')
                .filter(function(d) { return d.properties.continent != that.cont })
                .attr('fill',  function(d, i) {
                    return that.ColorScaleYear ('21032', DataProvider.getAverageForRegion(d.properties.subregion,that.year,"21032"),that.year);
                });

                //bei Continent view wird der aktuelle Kontinent in Länder eingefärbt
                if (that.view == "Continent"){
                    that.svg.selectAll('path')
                    .filter(function(d) { return d.properties.continent == that.cont })
                    .attr('fill',  function(d, i) {
                        return that.ColorScaleYear ('21032', DataProvider.getValuebyiso(d.properties.iso_a3,that.year,"21032"),that.year);
                    });
                }
                // alle nach region was != cont 
                // if view = cont continent nach iso einfärben
                //drawGeodata();
            });

        var gTime = d3
            .select('div#slider')
            .append('svg')
            .append('g')
            .attr('transform', 'translate(' + (that.width-616)/2 + ',30)');

        gTime.call(sliderTime);

        var svg_img = d3.select("#app").select('div#slider').select('svg');

        var myimage = svg_img.append('image')
            .attr('xlink:href', "https://i.imgur.com/wte92v7.jpg")
            .attr('width', "500")
            .attr('height', "100")
            .attr('transform', 'translate('+ (that.width-500)/2 + ',70)')
    },
    ColorScaleYear(code, value, year) {
      var myScale = d3.scaleLinear()
      .domain([DataProvider.getMinValueYear(code, this.year).Value,0,DataProvider.getMaxValueYear(code, this.year).Value])
      .range(['red', 'yellow', 'green']);         
      var ColorCode = myScale(value);
      if (ColorCode == ("rgb(0, 0, 0)") || year == "2001") {
          return "rgb(150, 150, 150)";
      }
      return ColorCode;
    },
    SizeScaleYear(code, value, year) {
      var that = this;
      var myScale = d3.scalePow()
      .exponent(2)
      .domain([DataProvider.getMinValueYear(code, that.year).Value,DataProvider.getMaxValueYear(code, that.year).Value])
      .range([0,200]);          
      var ColorCode = myScale(value);
      return ColorCode;
    },
    SizeScaleYearSidebar(code, value, year) {
      var that = this;
      var myScale = d3.scalePow()
      .exponent(2)
      .domain([DataProvider.getMinValueYear(code, that.year).Value,DataProvider.getMaxValueYear(code, that.year).Value])
      .range([0,50]);          
      var ColorCode = myScale(value);
      return ColorCode;
    },
    removeCountryFromList(iso_a3, year){
      var that = this;
      for (var i = 0; i<that.CompareList.length;i++) {
          if (that.CompareList[i][0] == iso_a3 && that.CompareList[i][1] == year) {
              that.CompareList.splice(i,1);
              break;
          }
      }
      that.drawList();
    },
    drawList(){
      var that = this;
      var previousCircleOffset = 0;
      var yPosCircleSidebar = 0;
      var circleOffset = [];
      var i;
      that.sidebar.selectAll('circle').remove();
      that.sidebar.selectAll("foreignObject").remove();
      //that.sidebar.selectAll("defs").remove();
      that.sidebar.selectAll('text').remove();

      for (i=0; i<that.CompareList.length;i++) {
          that.sidebar.append('circle')
              .attr('id', function(d) {
                  return "circleSidebar-"+that.CompareList[i][0]+"-"+that.CompareList[i][1];;
              })
              .attr('r',function(d){ 
                  circleOffset[i] = new Array(that.CompareList[i][0],that.SizeScaleYearSidebar('22013', DataProvider.getValuebyiso(that.CompareList[i][0],that.CompareList[i][1],"22013"), that.CompareList[i][1]));
                  if (circleOffset[i][1] == false || circleOffset[i][1] == undefined || circleOffset[i][1] !== circleOffset[i][1]) {
                    circleOffset[i][1] = 0;
                  }
                  return 15+circleOffset[i][1]; 
              })
              .attr('cx', function(d) {
                  return 30+circleOffset[i][1];
              })
              .attr('cy', function(d) {
                  if (yPosCircleSidebar == 0) {
                      yPosCircleSidebar = 30 + circleOffset[i][1];
                      previousCircleOffset = circleOffset[i][1];
                      circleOffset[i][2] = yPosCircleSidebar;
                      return yPosCircleSidebar
                  }
                  yPosCircleSidebar += 80 + previousCircleOffset + circleOffset[i][1];
                  previousCircleOffset = circleOffset[i][1];
                  circleOffset[i][2] = yPosCircleSidebar;
                  return yPosCircleSidebar;                      
              })
              .attr('stroke','black')
              .attr('fill', function(d) {
                  //dynamically change color of the circle diagram
                  var circleColor = that.ColorScaleYear('21032', DataProvider.getValuebyiso(that.CompareList[i][0],that.CompareList[i][1],"21032"), that.CompareList[i][1]);
                  var circlePercent;
                  var tempData = DataProvider.getValuebyiso(that.CompareList[i][0],that.CompareList[i][1],"210041");
                  if (tempData == "<2.5") {
                      circlePercent = "2.5";
                  } else if (tempData == false || tempData == undefined)
                  {
                      circlePercent = "100";

                      that.sidebar.append("text")
                      .attr("x", function(){
                          //nutzt "d" der fill funktion
                          return 30 + circleOffset[i][1];                                  
                      })
                      .attr("y", function(){
                          return 5 + circleOffset[i][2];
                      })
                      .attr("text-anchor", "middle") 
                      .attr("font-weight", "bold")
                      .style('fill', function(d){return circleColor;})
                      .style("font-size", "14px")
                      .text("n.a.");

                      return "url(#diagonalSchraffur)";
                  } else {
                      circlePercent = tempData;
                  }

                  var gradSidebar = that.sidebar.append("defs")
                      .append("linearGradient")
                      .attr("id", function (d) {
                          return "gradient-"+that.CompareList[i][0]+that.CompareList[i][1];
                      })
                      .attr("x1", "0%")
                      .attr("x2", "0%")
                      .attr("y1", "100%")
                      .attr("y2", "0%");

                  gradSidebar.append("stop")
                      .attr("offset", "0%")
                      .transition()
                      .style("stop-color", function (d) {
                          return that.ColorScaleYear('21032', DataProvider.getValuebyiso(that.CompareList[i][0],that.CompareList[i][1],"21032"), that.CompareList[i][1]);
                      })
                      .attr("offset", function(d) {
                          return (100-parseInt(circlePercent)) + "%";
                      });;

                  gradSidebar.append("stop")
                      .attr("offset", "0%")
                      .transition()
                      .style("stop-color", "white")
                      .attr("offset", function(d) {
                          return (100-parseInt(circlePercent)) + "%";
                      });

                  return ("url(#gradient-"+that.CompareList[i][0]+that.CompareList[i][1]+")");
              })
              .on("click", function(d) {
                    var id = this.id;
                    var split = id.split("-");
                    that.removeCountryFromList(split[1], split[2]);
              });

          that.sidebar.selectAll("foreignObject")
              .data(_data.features)
              .enter()
              .filter(function(d) {
                  if (that.CompareList[i].includes(d.properties.iso_a3)) {
                      return d.properties.iso_a3;
                  }
              })  
              .append("foreignObject")
              .attr("width", function (d) {
                  return that.sidebarWidth-circleOffset[i][1]*2;
              })
              .attr("height", function (d) {
                  return 100;
              })
              .attr("x", function(d){
                  return 60+circleOffset[i][1]*2;
              })
              .attr("y", function(d){
                  return circleOffset[i][2]-(2.5*that.fontSize);
              })
              .append("xhtml:body")
              .attr('id', function(d) {
                    return "foreignObject-"+that.CompareList[i][0]+"-"+that.CompareList[i][1];
                })
              .html(function(d) {
                  var undernourishment = DataProvider.getValuebyiso(that.CompareList[i][0],that.CompareList[i][1],"210041");
                  if (undernourishment == undefined || undernourishment == "") {
                      undernourishment = "n.a."
                  }
                  var GDP = DataProvider.getValuebyiso(that.CompareList[i][0],that.CompareList[i][1],"22013");
                  if (GDP == undefined || GDP == "") {
                      GDP = "n.a."
                  }
                  var politicalStability = DataProvider.getValuebyiso(that.CompareList[i][0],that.CompareList[i][1],"21032");
                  if (politicalStability == undefined || politicalStability == "") {
                      politicalStability = "n.a."
                  }
                  return "<p><b>"+d.properties.name+" ("+that.CompareList[i][1]+")</b><br>Undernourishment: "+undernourishment+"<br>GDP: "+GDP+"<br>Political stability: "+politicalStability+"</p>";
              })
              .on("click", function(d) {
                    var id = this.id;
                    var split = id.split("-");
                    that.removeCountryFromList(split[1], split[2]);
              });
      }
    }, 
    handleMouseClick(continent, iso_a3) {
      var that = this;
      console.log(continent + ' ' + iso_a3);
      that.hover = false;
      switch(that.view){
      case"World":
          // dont do anything if you just click the background
          if (continent == undefined) return;

          that.view = "Continent";
          that.cont = continent;
          
          // den angeklickten Kontinent hervorheben
          var transformString = "";
          switch(continent){
          case"Europe":
              //W: 1920 / H: 943
              //transformString = "translate(" + ((-1.1458*(width/1920))*width) + "," + ((-0.6362*(height/943))*height) + ")scale(3)";
              transformString = "translate(" + (-0.85*that.width) + "," + (-0.74*that.height) + ")scale(3)";
              break;
          case"North America":
              //transformString = "translate(" + ((-0.2083*(width/1920))*width) + "," + ((-0.4241*(height/943))*height) + ")scale(2)";
              transformString = "translate(" + (-0.1*that.width) + "," + (-0.45*that.height) + ")scale(2)";
              break;
          case"South America":
              transformString = "translate(" + (-0.35*that.width) + "," + (-1.27*that.height) + ")scale(2.5)";
              break;
          case"Asia":
              transformString = "translate(" + (-1*that.width) + "," + (-0.9*that.height) + ")scale(2.5)";
              break;
          case"Africa":
              transformString = "translate(" + (-0.7*that.width) + "," + (-1.1*that.height) + ")scale(2.5)";
              break;
          case"Oceania":
              transformString = "translate(" + (-2.15*that.width) + "," + (-2.35*that.height) + ")scale(4)";
              break;
          default:
              break;
          }
          //console.log(transformString);
          that.svg.selectAll('path')
          .filter(function(d) { return d.properties.continent == continent })
          .transition().duration(300)
          .attr("transform", transformString)
          .attr('fill',  function(d, i) {
              return that.ColorScaleYear('21032', DataProvider.getValuebyiso(d.properties.iso_a3,that.year,"21032"),that.year);
          })
          .on('end', function (){
              that.hover = true;
          });
          // alle nicht angeklickten Kontinente ausblenden
          that.svg.selectAll('path')
              .filter(function(d) { return d.properties.continent != continent })
              .transition().duration(300)
              .attr("transform", transformString)
              .attr('opacity', 0);
          break;
      case"Continent":
          //Add selected Country to List
          if (continent == that.cont){
              //and remove it, if it is in the List
              var alreadyInList = false;
              for (var i = 0; i < that.CompareList.length; i++) {
                  if (that.CompareList[i][0] == iso_a3 && that.CompareList[i][1] == that.year) {
                      that.removeCountryFromList(iso_a3, that.year);
                      alreadyInList = true;
                  }
              }
              if (alreadyInList == false) {
                  if (that.CompareList.length == 7) {
                      that.removeCountryFromList(that.CompareList[0][0], that.CompareList[0][1]);
                  }
                  that.CompareList[that.CompareList.length] = new Array(iso_a3,that.year);
              }
              console.log(that.CompareList);
              that.drawList();
              that.hover = true;
              break; 
          }
          else{
              // scale back if you just click the background or another continent
              that.view = "World";

              // alle kreise entfernen
              that.svg.selectAll('circle').remove();
              that.svg.selectAll('text').remove();
              
              //aktuellen Kontinent in Regionen einfärben
              that.svg.selectAll('path')
                  .filter(function(d) { return d.properties.continent == that.cont})
                  .attr('fill',  function(d, i) {
                      return that.ColorScaleYear ('21032', DataProvider.getAverageForRegion(d.properties.subregion,that.year,"21032"),that.year);
                  });
              
              //alle Kontinente einblenden
              that.svg.selectAll('path')
                  .transition().duration(300)
                  .attr("transform", "")
                  .attr('opacity', 1)
                  .on('end', function (){
                      that.hover = true;
                  });

              that.cont = null;
              break;
              }
        default:
          break;
      }
    }, 
    handleMouseOut() {
      var that = this;
      if(that.hover){
          switch(that.view){
          case"World":
              that.svg.selectAll('path')
                  .transition().duration(300)
                  .attr('opacity', 1);
          break;
          case"Continent":
              that.svg.selectAll('path')
                  .filter(function(d) { return d.properties.continent == that.cont })
                  .transition().duration(300)
                  .attr('opacity', 1);

              that.svg.selectAll('circle').remove();
              that.svg.selectAll('text').remove();
              break;
          default:
              break;
          }
      }
    },
    handleMouseOver(continent, country) {
      var that = this;
      if(that.hover){
        switch(that.view){
          case"World":
              that.svg.selectAll('path')
              .filter(function(d) { return d.properties.continent != continent })
              .transition().duration(100)
              .attr('opacity', 0.3);
          break;
          case"Continent":
              if (continent == that.cont){
                  that.svg.selectAll('path')
                  .filter(function(d) { return d.properties.name != country})
                  .filter(function(d) { return d.properties.continent == that.cont})
                  .transition().duration(100)
                  .attr('opacity', 0.3);

                  //define gradient for the circle diagram
                  var grad = that.svg.append("defs").append("linearGradient").attr("id", "grad")
                  .attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
                      grad.append("stop").attr("offset", "0%").style("stop-color", "black");
                      grad.append("stop").attr("offset", "0%").style("stop-color", "white");

                  // define "Schraffur" for "n.a." in the circle diagram
                  that.svg.select("defs")
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
                  
                  that.svg.selectAll('circle')
                  .data(_data.features)
                  .enter()
                  .filter(function(d) { return d.properties.name == country})
                  .append('circle')
                  .attr('id', 'hoverCircle')
                  .attr('r',function(d){ 
                      that.circleOffset = that.SizeScaleYear('22013', DataProvider.getValuebyiso(d.properties.iso_a3,that.year,"22013"), that.year);
                      if (that.circleOffset == false || that.circleOffset == undefined || that.circleOffset !== that.circleOffset) {
                          that.circleOffset = 0;
                      }
                      return 20+that.circleOffset; 
                  })
                  .attr('cx', function(d) {
                      if (d.properties.name == country) {
                          return d3.mouse(this)[0]+40+that.circleOffset;
                      }
                  })
                  .attr('cy', function(d) {
                      if (d.properties.name == country) {
                          return d3.mouse(this)[1];
                      }
                  })
                  .attr('stroke','black')
                  .attr('fill', function(d,i) {
                      //dynamically change color of the circle diagram
                      var circleColor = that.ColorScaleYear('21032', DataProvider.getValuebyiso(d.properties.iso_a3,that.year,"21032"), that.year);
                      var circlePercent;
                      var tempData = DataProvider.getValuebyiso(d.properties.iso_a3,that.year,"210041");
                      if (tempData == "<2.5") {
                          circlePercent = "2.5";
                      } else if (tempData == false || tempData == undefined)
                      {
                          circlePercent = "100";

                          that.svg.append("text")
                          .attr("x", function(d){return d3.mouse(this)[0]+40+that.circleOffset;})
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
                      that.svg.selectAll("stop")
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
                  //console.log(svg);
                  that.svg.append("text")
                  .attr("x", function(d){return d3.mouse(this)[0]+40+that.circleOffset;})
                  .attr("y", function(d){return d3.mouse(this)[1]-40-that.circleOffset;})
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
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
}

body {                
    margin:0;position:fixed;top:0;right:0;bottom:0;left:0; 
    font-family: Open Sans;
    font-weight: 300;
}
svg { 
    width:100%; height: 100%; 
}

.container{
    width: 100%;
    height: 100%;
    display:grid;
    grid-template-columns: 5fr 1fr;
    grid-template-rows: 5fr 1fr;
    grid-template-areas:
        "map"  "sidebar"
        "slider" "sidebar";
}

.slider_container{
    grid-area: "slider";
}

.svg_container{
    grid-area: "map";
}

.sidebar_container{
    grid-area: "sidebar";
}

b {
    font-weight: bold;
}
</style>
