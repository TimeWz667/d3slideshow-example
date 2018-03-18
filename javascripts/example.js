Vue.config.devtools = true

const show = d3slideshow.create("#example", "This is an example of d3slideshow")
    .layout("YXratio", 0.8)
    .layout("Prop", 0.3);


show.appendFigure("canvas")
    .event("init", function () {
        this.g.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("height", this.height)
          .attr("width", this.width)
          .attr("fill", "#7574a0");

        this.g.append("text")
          .attr("x", this.width/2)
          .attr("y", this.height/2)
          .attr("text-anchor", "middle")
          .style("font-size", "30px")
          .text("This is the canvas");
    });


show.appendFigure("threebody")
    .event("init", function () {
        d3.json("data/threebody.json", data => {
            this.elements.balls = this.g.selectAll('circle')
            .data(data).enter().append('circle')
            .attr('cx', (d, i) => i / 3 * this.width + this.width / 6)
            .attr('cy', (d, i) => this.height / 2)
            .attr('fill', d => d.Colour)
            .attr('r', d => d.Rad);
        });

    });


function demo_none (figs) {
    d3slideshow.hideAll(figs)
};


function demo_canvas (figs) {
    d3slideshow.highlight(figs, "canvas", 200)
};


function demo_A(figs) {
    d3slideshow.highlight(figs, "threebody", 200);
};

function demo_B(figs) {
    const fig = d3slideshow.highlight(figs, 'threebody')
    const balls = fig.elements.balls;

    balls.transition().duration(100)
        .attr('r', d => d.Rad * 2);
};

function update_A(figs, prog) {
    const fig = figs.threebody;
    const balls = fig.elements.balls;
console.log(fig.height, arguments)
    balls.transition()
        .attr('cx', (d, i) => i / 3 * fig.width + fig.width / 6)
        .attr('cy', (d, i) => fig.height/2 + (i-1) / 3 * fig.height*prog);
};

function update_B(figs, prog) {
  const fig = figs.threebody;
  const balls = fig.elements.balls;

    balls.transition()
    .attr('cx', (d, i) => i / 3 * fig.width*(1-prog) + fig.width / 6)
    .attr('cy', (d, i) => fig.height/2 + (i-1) / 3 * fig.height);
};

show.appendSlide()
    .text('Chapter', 'd3slideshow')
    .text('Section', 'Introduction')
    .text('Context',
`
It is a slide show generator
- Control by vue.js
- Visualise and animate by d3.js
- Support markdown by marked.js
     `)
    .event('activate', demo_none);


show.appendSlide()
    .text('Chapter', 'Usage')
    .text('Section', 'Get started')
    .text('Context',
`

### Initialise
var show = d3slideshow.create(selector, title)

### Set up layout options
show.layout("YXratio", 0.8)
show.layout("Prop", 0.3);
     `)
    .event('activate', demo_canvas);

show.appendSlide()
    .text('Chapter', 'Usage')
    .text('Section', 'Add a figure')
    .text('Context', `
### Append a new figure
var fig = show.appendFigure(figure name)

### Set up initialisation function
fig.event("init", initialisation function)

### Basic attributes of a figure
- **fig.g** the svg group
- **fig.elements** an object storing svg elements
- **fig.width** the width of the canvas
- **fig.height** the height of the canvas
- **fig.show()** show the figure
- **fig.hide()** hide the figure

     `)
    .event('activate', demo_A);


show.appendSlide()
    .text('Chapter', 'Usage')
    .text('Section', 'Add a slide')
    .text('Context', `
### Append a new slide
var slide = show.appendSlide()

### Write texts

#### Chapter
slide.text('Chapter', chapter name)

#### Section
slide.text('Section', section name)

#### Context (with markdown)
slide.text('Context', main context with markdown)

     `)
     .event('activate', demo_B);

show.appendSlide()
    .text('Chapter', 'Usage')
    .text('Section', 'Activate figures')
    .text('Context', `
### Define activation function
slide.event('activate', callback(figs))

- **figs** a dictionary of all figures

### Highlight a figure and hide the others (in activation function)
fig = d3slideshow.highlight(figs, figure name)

     `)
    .event('activate', demo_A)
    .event('update', update_A);


show.appendSlide()
    .text('Chapter', 'Usage')
    .text('Section', 'Update figures')
    .text('Context', `
### Define update function
slide.event('update', callback(figs, progress))

- **progress** a indicator of the currenet progress [0, 1)
- meaningless for the last slide

     `)
    .event('activate', demo_A)
    .event('update', update_B);

show.appendSlide()
    .text('Chapter', 'Usage')
    .text('Section', 'Finally...')
    .text('Context', `

- Hack d3slideshow.css for your style
- Provide some comments

     `)
    .event('activate', demo_A);



show.start();
