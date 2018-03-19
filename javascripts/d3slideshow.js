(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
        (factory((global.d3slideshow = global.d3slideshow || {})));
}(this, (function (exports) {
    "use strict";

    var version = "1.0.0";
    window.onbeforeunload = function () {
        window.scrollTo(0, 0);
    }

    var layout_template = '<div><div id="title"><h1>{{ Title }}</h1></div>' +
        '<div id="slides"><div id="sections">' +
        '<section class="slide" v-for="slide in Slides" v-bind:slide="slide">' +
        '<div class="prefix"></div>' +
        '<div class="chapter">{{ slide.Chapter }}</div>' +
        '<div class="section">{{ slide.Section }}</div>' +
        '<div v-html="slide.Context"></div>' +
        '</section></div>' +
        '<div id="canvas"></div><div id="extra-space"></div>' +
        '</div>' +
        '<div id="pager">Page {{ Page }}: {{ (100*Progress).toFixed() }}% </div>' +
        '</div>';


    function Figure(name, init) {
        this.Name = name;
        this.g = null;
        this.elements = {};
        this.width = 0;
        this.height = 0;
        this.init = init || function () {};
    }

    Figure.prototype.initialise = function (g, width, height) {
        this.width = width;
        this.height = height;
        this.g = g.append("g").attr("id", this.Name);
        this.init();
        this.hide();
    };

    Figure.prototype.hide = function (t) {
        if (this.g !== null) {
          this.g.transition().duration(t||0).attr("opacity", 0);
        }
    }

    Figure.prototype.show = function (t) {
        if (this.g !== null) {
          this.g.transition().duration(t||0).attr("opacity", 1);
        }
    }

    Figure.prototype.event = function (key, value) {
        if (arguments.length > 1) {
            this[key] = value;
            return this;
        }
        if (this.hasOwnProperty(key)) {
            return this[key];
        }
        return this;
    };


    function Slide(chapter, section, context, act, update) {
        this.Texts = {
            Chapter: chapter || '',
            Section: section || '',
            Context: context || ''
        }

        this.Events = {
            activate: act || function () {},
            update: update || function () {}
        }
    }

    Object.defineProperty(Slide.prototype, 'Chapter', {
        get: function () {
            return this.text('Chapter');
        }
    });

    Object.defineProperty(Slide.prototype, 'Section', {
        get: function () {
            return this.text('Section');
        }
    });

    Object.defineProperty(Slide.prototype, 'Context', {
        get: function () {
            return marked(this.text('Context'));
        }
    });

    Object.defineProperty(Slide.prototype, 'activate', {
        get: function () {
            return this.event('activate');
        }
    });

    Object.defineProperty(Slide.prototype, 'update', {
        get: function () {
            return this.event('update');
        }
    });

    Slide.prototype.text = function (key, value) {
        if (this.Texts.hasOwnProperty(key)) {
            if (arguments.length > 1) {
                this.Texts[key] = value;
            } else {
                return this.Texts[key];
            }
        }
        return this;
    };

    Slide.prototype.event = function (key, value) {
        if (this.Events.hasOwnProperty(key)) {
            if (arguments.length > 1) {
                this.Events[key] = value;
            } else {
                return this.Events[key];
            }
        }
        return this;
    };


    function SlideShow(app_tag, title) {
        this.Container = d3.select(app_tag);
        this.Title = title;
        this.TagApp = app_tag;

        this.Layout = {
            Margin: {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            },
            YXratio: 0.8,
            Prop: 0.3
        }

        this.Figures = {};
        this.Slides = [];
    }

    SlideShow.prototype.layout = function (key, value) {
        if (arguments.length > 1) {
            this.Layout[key] = value;
            return this;
        }
        if (this.Layout.hasOwnProperty(key)) {
            return this.Layout[key];
        }
        return this;
    };


    SlideShow.prototype.appendSlide = function (slide) {
        var s = slide || new Slide();
        this.Slides.push(s);
        return s;
    };

    SlideShow.prototype.appendFigure = function (figure) {
        if (typeof figure === "string") {
            figure = new Figure(figure);
        }
        this.Figures[figure.Name] = figure;
        return figure;
    };

    SlideShow.prototype.start = function () {
        this.appendSlide();
        var lyo = this.Layout;

        this.App = new Vue({
            el: this.TagApp,
            data: {
                Slides: this.Slides,
                Figures: this.Figures,
                Title: this.Title,
                Page: 0,
                Progress: 0,
                SectionPositions: [],
                TitleTop: 0,
                svg: null,
                g: null,
                isPrepared: false
            },
            created: function () {
                d3.select(window)
                    .on("scroll.scroller", this.position)
                    .on("resize.scroller", this.resize);
            },
            mounted: function () {

                this.TitleTop = this.$el.getBoundingClientRect().top;

                d3.select(this.$el).select("#sections").style("width", lyo.Prop * 100 + "%")


                var canvas = d3.select(this.$el).select("#canvas");
                canvas.style("width", 90 - lyo.Prop * 100 + "%")
                lyo.Width = canvas.node().getBoundingClientRect().width;
                lyo.Height = lyo.Width * lyo.YXratio
                canvas.style("height", lyo.Height + "px");

                lyo.gWidth = lyo.Width - lyo.Margin.left - lyo.Margin.right;
                lyo.gHeight = lyo.Height - lyo.Margin.top - lyo.Margin.bottom;

                this.svg = canvas.append("svg")
                    .attr("width", lyo.Width)
                    .attr("height", lyo.Height);

                this.g = this.svg.append("g")
                    .attr("transform", "translate(" + lyo.Margin.left + "," + lyo.Margin.top + ")");

                for (var fig in this.Figures) {
                    this.Figures[fig].initialise(this.g, lyo.gWidth, lyo.gHeight);
                }

                this.isPrepared = true;
/*                d3.timeout(() => {
                    Object.values(this.Figures).forEach(fig => {
                        fig.initialise(this.g, lyo.gWidth, lyo.gHeight);
                    });
                });*/
                this.resize();
                d3.timeout(this.position, 200);
            },
            computed: {

            },
            methods: {
                position: function () {
                    var offset = 0;
                    var pos = offset - this.$el.getBoundingClientRect().top;
                    var currIndex = Math.min(this.Slides.length - 1, d3.bisect(this.SectionPositions, pos));
                    var prevIndex = Math.max(currIndex - 1, 0);
                    var prevTop = this.SectionPositions[prevIndex];
                    var prog = (pos - prevTop + offset) / (this.SectionPositions[currIndex] - prevTop);
                    this.Progress = (prog > 1) ? 0 : prog;
                    this.Page = (prog > 1) ? currIndex + 1 : currIndex;

                    var titleBot = d3.select(this.$el).select("#title").node().getBoundingClientRect().bottom;
                    d3.select(this.$el).select("#canvas").style("top", Math.max(titleBot, this.TitleTop) + 10 + "px");
                },
                resize: function () {
                    var containerTop = this.$el.getBoundingClientRect().top + window.pageYOffset;

                    this.SectionPositions = [];
                    var startPos;
                    var pos = this.SectionPositions;

                    d3.select(this.$el).selectAll(".slide").each(function (d, i) {
                        var top = this.getBoundingClientRect().top;
                        if (i === 0) {
                            startPos = top;
                        }
                        pos.push(top - startPos);
                    });

                },
                activate: function () {
                    if (this.Page > 0) {
                        this.Slides[this.Page - 1].activate(this.Figures);
                    }
                },
                update: function () {
                    if (this.Page > 0) {
                        this.Slides[this.Page - 1].update(this.Figures, this.Progress);
                    }
                }
            },
            watch: {
                Page: function () {
                    console.log("activate page " + this.Page)
                    if (!this.isPrepared) {
                        return;
                    }
                    d3.selectAll(".slide")
                        .style("opacity", (d, i) => i === this.Page - 1 ? 1 : 0.1);
                    this.activate(this.page)
                },
                Progress: function () {
                    //console.log('update to ' + this.Progress)
                    this.update(this.page, this.progress)
                }
            }
        });
    }

    function highlight(figs, name, dt) {
        Object.values(figs).filter(fig => fig.Name != name).forEach(fig => fig.hide(dt));
        var fig = figs[name];
        if (fig != null) {
            fig.show(dt);
            return fig;
        }
    }

    function hideAll(figs) {
        Object.values(figs).forEach(function(fig) {
          fig.hide(0);
        })
    }

    function create(app_tag, title) {
        d3.select(app_tag).node().innerHTML = layout_template;
        return new SlideShow(app_tag, title);
    }


    exports.version = version;
    exports.create = create;
    exports.highlight = highlight;
    exports.hideAll = hideAll;


    Object.defineProperty(exports, '__esModule', {
        value: true
    });

})));
