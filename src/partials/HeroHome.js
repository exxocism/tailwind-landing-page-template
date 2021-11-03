import React, { useEffect, useRef, useState } from 'react';
import Modal from '../utils/Modal';
import * as d3 from 'd3';
import * as topojson from 'topojson';

function HeroHome() {

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [dataFetch, setDataFetch] = useState( false );
  const svgRef = useRef( null );
  const tooltipRef = useRef( null );

  useEffect( () => {
    const fetchData = async() => {
      const promise_countries = fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json');
      const promise_education = fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json');
      const raw_countries = await promise_countries;  
      const raw_education = await promise_education;
      const data_countries = await raw_countries.json();
      const data_education = await raw_education.json();
      return [data_countries, data_education];
    };
    fetchData().then( result => setDataFetch( result ) );
  }, []);
 
  useEffect( () => {

    if( !dataFetch ) return ;
    const [data_countries, data_education] = dataFetch;

    const NOT_FOUND = -1;
    const D3_SCREEN_WIDTH = 1080;
    const D3_SCREEN_HEIGHT = 600;
    const PADDING = 60;

    const tooltip = d3.select(tooltipRef.current)
                      .attr("id", "tooltip")
                      .style("opacity", 0);      
    
    const path = d3.geoPath();
    
    const svg = d3.select(svgRef.current)
                  .attr("width", D3_SCREEN_WIDTH)
                  .attr("height", D3_SCREEN_HEIGHT)
                  .attr("viewBox", `0 0 ${D3_SCREEN_WIDTH} ${D3_SCREEN_HEIGHT}`);
  
    const eduScale_min = d3.min( data_education, data => data.bachelorsOrHigher );
    const eduScale_max = d3.max( data_education, data => data.bachelorsOrHigher );
    const eduScale = d3.scaleLinear()
                       .domain([eduScale_min, eduScale_max])
                       .range([PADDING, D3_SCREEN_WIDTH - PADDING]);
    
    const EDUSCALE_COLORS = 8;
    const colors = d3.scaleThreshold()
                     .domain( d3.range(eduScale_min, eduScale_max, 
                                       (eduScale_max - eduScale_min) / EDUSCALE_COLORS) )
                     .range( d3.schemeBlues[EDUSCALE_COLORS + 1] );
    
    svg.append('g')
       .attr('class', 'counties')
       .selectAll('path')
       .data( topojson.feature(data_countries, data_countries.objects.counties).features )
       .enter()
       .append('path')
       .attr('class', 'county')
       .attr('data-fips', d => d.id )
       .attr('data-education', d => { 
                const result = data_education.find(data => data.fips === d.id);
                if( result !== NOT_FOUND ) return result.bachelorsOrHigher;
                console.log('error(edu) : data not exist for ', d.id);
                return 0;
             })
        .attr('data-state', d => { 
                const result = data_education.find(data => data.fips === d.id);
                if( result !== NOT_FOUND ) return result.area_name + ', ' + result.state;
                console.log('error(state) : data not exist for ', d.id);
                return 0;
             })
        .attr('fill', d => {
                const result = data_education.find(data => data.fips === d.id);
                if( result !== NOT_FOUND ) return colors( result.bachelorsOrHigher );
                console.log('error(fill) : data not exist for ', d.id);
                return colors(0);
             })
        .attr('d', path)
        .on("mouseover", (e) => {
            //console.log(e);
            const thisWidth = tooltip.node().getBoundingClientRect().width;
            const thisHeight = tooltip.node().getBoundingClientRect().height;
            tooltip
              .html(
                e.target.dataset.state + " : " + e.target.dataset.education + "%"
              )
              .style("left", (e.pageX - 380) + "px") 
              .style("top", (e.pageY - 420) + "px")
              .attr("data-education", e.target.dataset.education)
              .style("opacity", 0.7);
          })
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
    
    const legend = svg.append("g").attr("id", "legend");
    
    legend.selectAll("#legend")
          .data(
            colors.range().map( d => {
              d = colors.invertExtent(d);
              if( d[0] === null ) d[0] = eduScale.domain()[0];
              if( d[1] === null ) d[1] = eduScale.domain()[1];
              return d;
            })
          )
          .enter()
          .append("rect")
          .attr("x", (d, i) => i * 20 + 600)
          .attr("y", 40)
          .attr("width", 18)
          .attr("height", 18)
          .attr("stroke", "black")
          .attr("stroke-width", "0.5")
          .attr("fill", (d, i) => i===0? '#ffffff':colors(d[0]));

  }, [dataFetch]);

  const tooltipStyle = {
    "backgroundColor": "lightyellow",
    "color": "black",
    "border": "1px solid black",
    "position": "absolute",
    "padding": "10px",
    "borderRadius": "10px",
    "fontSize": "12px",
    "textAlign": "center",
  };

  return (
    <section className="relative">

      {/* Illustration behind hero content */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none" aria-hidden="true">
        <svg width="1360" height="578" viewBox="0 0 1360 578" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="illustration-01">
              <stop stopColor="#FFF" offset="0%" />
              <stop stopColor="#EAEAEA" offset="77.402%" />
              <stop stopColor="#DFDFDF" offset="100%" />
            </linearGradient>
          </defs>
          <g fill="url(#illustration-01)" fillRule="evenodd">
            <circle cx="1232" cy="128" r="128" />
            <circle cx="155" cy="443" r="64" />
          </g>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Hero content */}
        <div className="pt-32 pb-12 md:pt-40 md:pb-20">

          {/* Section header */}
          <div className="text-center pb-12 md:pb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tighter tracking-tighter mb-4" data-aos="zoom-y-out"><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">United States</span><br />Educational Attainment</h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 mb-8" data-aos="zoom-y-out" data-aos-delay="150">Codestates student SEB #34th charlie chuckles.<br /> using D3 and topojson library.</p>
            </div>
          </div>

          {/* D3 libraries */}
          <div className="relative flex justify-center">
            <div style={tooltipStyle} ref={tooltipRef}></div>
            <svg className="justify-center" ref={svgRef}></svg>
          </div>

        </div>

      </div>

    </section>
  );
}

export default HeroHome;