import React, { Component } from 'react'
import * as d3 from "d3";
import facetree from './facetree'
import Individual from './Individual'
import { Link, makeRadialLink, makeLinkPath } from './Link'
import { pol2cart, coordAsTransform } from './utils'
import { LinearProgress } from '@mui/material';

const distanceGen = 140;
const genCount = 7
const width = (2 * genCount + 10) * distanceGen;
const height = width
const animationSpeed = 150
const startYear = 1810
const endYear = new Date().getFullYear()

const tree = data => d3.tree()
  .size([2 * Math.PI, 800]) // polar coordinate system
  //.size([width, height])
  .separation((a, b) => {
    return (a.parent == b.parent ? 1 : 2) / a.depth
  })
  (d3.hierarchy(data))

const toggleChildren = d => {
  if (d.children) {
      d._children = d.children;
      d.children = null;
  } else if (d._children) {
      d.children = d._children;
      d._children = null;
  }
  return d;
}

const styles = {
  tooltip: {
    opacity: 0,
    position: "absolute",
    top: 0,
    backgroundColor: "white",
    border: "solid",
    borderWidth: 2,
    borderRadius: 5,
    padding: 5,
  },
  svg: {
    maxHeight: "95vh",
    width: "100%",
    font: "10px sans-serif",
    margin: 5,
  },

}
export default class Chart extends Component {

  chartRef = React.createRef()
  nodesRef = React.createRef()
  linksRef = React.createRef()
  svgRef = React.createRef()
  treeRef = React.createRef()
  yearTextRef = React.createRef()
  
  state = {
    tooltipDynamicStyle: {},
    tooltipText: '',
  }

  setTransform() {
    const tree = d3.select(this.treeRef.current)
    this.treeRef.current.getBBox
    const { scale, x, y, rotation } = this.props.options
    // TODO figure out how to rotate relative to transformed origin
    const transform = `rotate(${rotation}) translate(${x}, ${y}) scale(${scale})`
    console.log("setTransform", transform)
    tree.attr("transform", transform)
  }

  componentDidMount() {
    this.updateD3(this.props)
    // initial tree animation
    this.initialTransitions()
    //this.queueTransitions(20)
  }

  componentDidUpdate(prevProps) {
    const { mode, animate, rotation, scale } = this.props.options
    if (prevProps.mode !== mode) {
      console.log("Transition link styles")
      const link = d3.selectAll('.link')
        .transition()
        .duration(1500)
        .attr("d", d => mode === 'Edged' ? makeLinkPath(d) : makeRadialLink(d))
    }
    if (prevProps.animate !== animate) {
      if (animate) {
        this.queueTransitions()
      } else {
        const svg = d3.select(this.svgRef.current)
        svg.selectAll('.individual').interrupt('grow').selectAll('*').interrupt('grow')
        svg.selectAll('.link').interrupt('grow')
        d3.select(this.yearTextRef.current).interrupt()
      }
    }
  }

  shouldComponentUpdate(prevProps, prevState) {
    const { rotation, scale, x, y } = this.props.options
    const rotationChange = prevProps.rotation !== rotation
    const scaleChange = prevProps.scale !== scale
    const xChange = prevProps.x !== x
    const yChange = prevProps.y !== y
    if (rotationChange || scaleChange || xChange || yChange) {
      this.setTransform()
      console.log("Dont rerender, but let d3 update transform")
      return false
    }
    return true
  }

  initialTransitions() {
    const animationSpeed = 200
    const root = tree(this.props.data.root)

    const treeNodes = root ? root.descendants().reverse() : []

    const nodes = d3.select(this.nodesRef.current)

    const transition = d3.transition('grow').duration(animationSpeed).ease(d3.easeQuadIn)

    const links = d3.select(this.linksRef.current)

    links.selectAll('.link')
      .data(root.links())
      //.attr('stroke-dasharray', function(d) { this.getTotalLength() + " " + d.node.getTotalLength()})
      //.attr('stroke-dashoffset', function(d) { this.getTotalLength()})
      .transition(transition)
      .delay(d => d.target.data.generation * transition.duration())
      .style("opacity", 1)
      //.ease(d3.easeLinear)
      //.attr("stroke-dashoffset", 0)

    const nodesData = nodes.selectAll('.individual').data(treeNodes)

    nodesData
      .transition(transition)
      .delay(d => d.data.generation * transition.duration())
      .attr("transform", d => coordAsTransform(pol2cart(this.props.mode === 'Edged' ? d.data.generation * distanceGen : d.y, d.x)))
      .style('opacity', 1)

    nodes.selectAll('circle')
      .data(treeNodes)
      .transition(transition)
      .delay(d => d.data.generation * transition.duration())
      .style("opacity", 1)

    nodes.selectAll('text')
      .data(treeNodes)
      .transition(transition)
      .delay(d => (d.data.generation) * transition.duration())
      .style('opacity', 1)
  }

  queueTransitions(animationSpeed) {
    console.log('queing transitions')
    const root = tree(this.props.data.root)

    const treeNodes = root ? root.descendants().reverse() : []

    const yearText = d3.select(this.yearTextRef.current)
    yearText
      .transition()
      .duration(animationSpeed)
      .on("start", function repeat() {
        console.log("run repeat")
        d3.active(this)
            .tween("text", function() {
              const nextYear = parseInt(yearText.text())+1
              console.log(nextYear, endYear)
              if (nextYear > endYear) {
                console.log("Interrupt animation")
                yearText.interrupt()
              }
              // const interpolate = d3.interpolateNumber(that.text().replace(/,/g, ""), parseInt(that.text())+1)
              return function(t) { yearText.text(nextYear); };
            })
          .transition()
          .duration(animationSpeed)
          .on("start", repeat);
      });

    const nodes = d3.select(this.nodesRef.current)

    const transition = d3.transition('grow').duration(animationSpeed).ease(d3.easeQuadIn)

    const links = d3.select(this.linksRef.current)

    links.selectAll('.link')
      .data(root.links())
      //.attr('stroke-dasharray', function(d) { this.getTotalLength() + " " + d.node.getTotalLength()})
      //.attr('stroke-dashoffset', function(d) { this.getTotalLength()})
      .transition(transition)
      .delay(d => (d.target.data.birth.from - startYear)*transition.duration())
      .style("opacity", 1)
      //.ease(d3.easeLinear)
      //.attr("stroke-dashoffset", 0)

    const nodesData = nodes.selectAll('.individual').data(treeNodes)

    nodesData
      .transition(transition)
      .delay(d => (d.data.birth.from - startYear) * transition.duration())
      .attr("transform", d => coordAsTransform(pol2cart(this.props.mode === 'Edged' ? d.data.generation * distanceGen : d.y, d.x)))
      .style('opacity', 1)

    nodes.selectAll('circle')
      .data(treeNodes)
      .transition(transition)
      .delay(d => (d.data.birth.from - startYear)*transition.duration())
      .style("opacity", 1)

    nodes.selectAll('text')
      .data(treeNodes)
      .transition(transition)
      .delay(d => (d.data.birth.from - startYear + 1)*transition.duration())
      .style('opacity', 1)
  }

  updateD3() {

    const svg = d3.select(this.svgRef.current)
    const treeContainer = d3.select(this.treeRef.current)
    treeContainer.attr("transform", `rotate(${this.props.rotation})`)

    const zoom =
      d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", () => {
        const { onZoom } = this.props
        if (onZoom) {
          onZoom(d3.event.transform)
        }
      })
    svg
      .call(zoom)

    const yearText = d3.select(this.yearTextRef.current)
    yearText
      .attr("transform", function(d) {
        const width = this.getComputedTextLength()
        return `translate(${-width/2.0}, -25)`
      })

  }

  closeTooltip = () => {
    this.setState({
      tooltipDynamicStyle: {
        opacity: 0,
      },
      tooltipText: ""
    })
  }

  openTooltip = (pos, text, imageId) => {
    this.setState({
      tooltipDynamicStyle: {
        opacity: 1,
        left: pos.x,
        top: pos.y + 7,
      },
      tooltipText: text,
      tooltipImg: null,
    })
    if (imageId) {
      facetree.get_image(imageId).then(imageData => {
        this.setState({tooltipImg: 'data:image/jpeg;base64,' + imageData})
      })
      .catch(error => {
          console.log("Image download failed")
          console.log(error)
      });
    }
  }

  render() {
    console.log("Render")
    //const { treeRoot, links } = this.state
    const { data, options } = this.props
    const { tooltipDynamicStyle, tooltipText, tooltipImg } = this.state
    const treeRoot = tree(data.root)
    const treeNodes = treeRoot ? treeRoot.descendants().reverse() : []
    const links = treeRoot ? treeRoot.links() : []
    if (!data) {
      return <LinearProgress/>
    }
    return (
      <div ref={this.chartRef}>
        <div id="tooltip" style={{
          ...styles.tooltip,
          ...tooltipDynamicStyle,
        }}>
          <p>{tooltipText}</p>
          {tooltipImg && <img src={tooltipImg}/>}
        </div>
        <svg
          style={styles.svg}
          pointerEvents="all"
          ref={this.svgRef}
          viewBox={[-height/2, -width/2, height, width]}
          // width={width}
          // height={height}
        >
          <g ref={this.treeRef}>
            <text style={{fontSize: '8em'}} ref={this.yearTextRef}>{startYear}</text>
            <g ref={this.linksRef}>
              {links.map((link, i) => <Link key={i} mode={options.mode} data={link} />)}
            </g>
            <g ref={this.nodesRef}>
              {treeNodes.map(node => <Individual data={node} onHover={this.openTooltip} onLeave={this.closeTooltip} onClick={this.openModal} />)}
            </g>
          </g>
        </svg>
      </div>
    )
  }


}