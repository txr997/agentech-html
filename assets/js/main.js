/*
	Template Name: AI Agentech - AI Agency & Technology HTML Template
	Author: https://themexriver.com/
	Version: 1.0
*/

(function ($) {
"use strict";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/*
	preloader-1 — the light runs over the logo (css) while the page loads; on window load, once the panel has been up for a
	moment, it fades out
*/
function agPreloaderInit() {

	var loader = document.querySelector(".ag-preloader-1");
	if (!loader) return null;

	if (prefersReducedMotion()) {
		return {
			done: function () {
				loader.remove();
				afterPreloader();
			}
		};
	}

	var shownAt = performance.now();
	var exited = false;

	// the mask of the light (data-mask-image) is set by main-common.js before this runs, so the light can show now
	loader.classList.add("is-ready");

	gsap.from(loader.firstElementChild, {
		opacity: 0,
		duration: .8,
		ease: "power2.out"
	});

	function exit() {
		if (exited) return;
		exited = true;

		// the fade is a css transition (is-leaving, 1s), run by the compositor, so it does not stutter while the page behind starts its intro
		loader.classList.add("is-leaving");

		// the intro starts while the panel is still fading, the panel goes when the fade is over
		gsap.delayedCall(.4, afterPreloader);
		gsap.delayedCall(1.1, function () {
			loader.remove();
		});
	}

	return {
		// it stays at least 1.6s, so a page that is ready at once does not flash the loader and the light runs over the logo at least once
		done: function () {
			gsap.delayedCall(Math.max(0, 1.6 - (performance.now() - shownAt) / 1000), exit);
		}
	};
}

var agPreloader = agPreloaderInit();


// the plain words of a title become masked words (the mask cuts them off at their line), anything else inside it stays as it is
function agHeroWords(title, maskClass, wordClass) {
	var words = [];

	Array.prototype.slice.call(title.childNodes).forEach(function (node) {
		if (node.nodeType !== 3) return;

		var frag = document.createDocumentFragment();
		node.textContent.split(/(\s+)/).forEach(function (part) {
			if (!part) return;
			if (!part.trim()) {
				frag.appendChild(document.createTextNode(" "));
				return;
			}

			var mask = document.createElement("span");
			var word = document.createElement("span");
			mask.className = maskClass;
			word.className = wordClass;
			word.textContent = part;
			mask.appendChild(word);
			frag.appendChild(mask);
			words.push(word);
		});
		title.replaceChild(frag, node);
	});

	return words;
}


/*
	hero-1 (AI Agentech) — the picture of the new slide opens like an iris (a circle that grows from
	the middle of the stage, a thin ring runs on its edge) and settles from a zoom, the robot comes in out of a blur, then the words of the
	title come up from behind their line one after another and the text and the button follow. The counter and the thumbnails follow the
	active slide, a click on a thumbnail jumps to its slide. The first slide opens right after the preloader and the slides go on by themselves
*/
var agHero1First = null;
var agHero1Swiper = null;

function agHero1Slider() {

	if (!$(".ag-hero-1-slider").length) return;

	var slider = document.querySelector(".ag-hero-1-slider");
	var backSlides = slider.querySelectorAll(".ag-hero-1-slider-back .swiper-slide");
	var $thumbs = $(".ag-hero-1-thumb");
	var $current = $(".ag-hero-1-count .current");
	var scenes = [];
	var rim = null;
	// the ghost title sits in the front slider and does not fade with the slides, so it is brought in by hand on every slide
	var mark = prefersReducedMotion() ? null : slider.querySelector(".ag-hero-1-watermark");
	var markGlass = mark ? mark.querySelector(".glass") : null;
	var markEdge = mark ? mark.querySelector(".edge") : null;
	var markTl = null;

	if (!prefersReducedMotion()) {
		$(".ag-hero-1-slider-front .swiper-slide").each(function (i) {
			var title = this.querySelector(".ag-hero-1-title");

			scenes.push({
				back: backSlides[i],
				bg: backSlides[i].querySelector(".ag-hero-1-bg img"),
				robot: this.querySelector(".ag-hero-1-main img"),
				words: title ? agHeroWords(title, "ag-hero-1-word-mask", "ag-hero-1-word") : [],
				rest: Array.prototype.slice.call(this.querySelectorAll(".ag-hero-1-text, .ag-pr-btn-1")),
				tl: null
			});
		});

		rim = document.createElement("div");
		rim.className = "ag-hero-1-rim";
		slider.appendChild(rim);
		gsap.set(rim, { autoAlpha: 0 });
	}

	// parked: the picture is closed (a circle of nothing), the robot and the text wait for their turn
	function park(scene) {
		if (scene.tl) scene.tl.kill();

		// the button has a css transition for its hover, it would lag behind gsap
		gsap.set(scene.rest, { transition: "none", y: 28, opacity: 0, filter: "blur(6px)" });
		gsap.set(scene.words, { yPercent: 115, rotate: 5, opacity: 0, filter: "blur(10px)", transformOrigin: "0% 100%" });
		gsap.set(scene.robot, { y: 70, scale: .82, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 100%" });
		gsap.set(scene.bg, { scale: 1.2 });
		scene.back.style.clipPath = "circle(0px at 50% 58%)";
	}

	// the picture that goes out is cut away where the circle of the new one is (a hole that grows with it, 2px under the circle so no seam
	// shows), so the new picture always sits on the dark panel alone: the first and the third are 60% see-through and would otherwise show
	// the old one through them until it is taken away at the end, and jump darker then
	function maskLeaving(slide, r) {
		var hole = Math.max(0, r - 2);

		slide.style.maskImage = slide.style.webkitMaskImage = "radial-gradient(circle at 50% 58%, transparent " + hole + "px, #000 " + (hole + 1) + "px)";
	}

	function unmask(slide) {
		slide.style.maskImage = slide.style.webkitMaskImage = "";
	}

	function serve(scene, leaving) {
		var targets = [scene.bg, scene.robot].concat(scene.words, scene.rest);
		var iris = { r: 0 };
		// the circle opens at 50% 58% and has to reach the farthest corner
		var reach = Math.hypot(slider.clientWidth / 2, slider.clientHeight * .58) + 10;

		scene.tl = gsap.timeline({
			defaults: { ease: "power3.out" },
			onComplete: function () {
				scene.back.style.clipPath = "";
				Array.prototype.forEach.call(backSlides, function (slide) {
					slide.classList.remove("is-leaving");
					unmask(slide);
				});
				gsap.set(targets, { clearProps: "transform,opacity,filter,transition" });
			}
		})
			.to(iris, {
				r: reach,
				duration: 1.5,
				ease: "power3.inOut",
				onUpdate: function () {
					scene.back.style.clipPath = "circle(" + iris.r + "px at 50% 58%)";
					if (leaving) maskLeaving(leaving, iris.r);
					rim.style.width = rim.style.height = iris.r * 2 + "px";
				}
			}, 0)
			.fromTo(rim, { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 }, 0)
			.to(rim, { autoAlpha: 0, duration: .3 }, 1.2)
			.to(scene.bg, { scale: 1, duration: 2, ease: "power2.out" }, 0)
			.to(scene.robot, { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.4 }, .5)
			// the words wait until the circle has reached the text
			.to(scene.words, { yPercent: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger: .08 }, .9)
			.to(scene.rest, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: .15 }, 1.25);
	}

	// the glass and its edge wait below their place; only these two are animated, the box itself is centred by a transform
	function markPark() {
		if (!mark) return;
		if (markTl) markTl.kill();

		gsap.set(markGlass, { y: 70, opacity: 0 });
		gsap.set(markEdge, { y: 70, opacity: 0, filter: "blur(12px)" });
	}

	// what is shown goes up and out (not on the first slide), then the glass rises into its place and the edge follows out of a blur,
	// timed to meet the circle of the new picture
	function markServe(out) {
		if (!mark) return;
		if (markTl) markTl.kill();

		markTl = gsap.timeline({
			defaults: { ease: "power3.out" },
			onComplete: function () {
				gsap.set([markGlass, markEdge], { clearProps: "transform,opacity,filter" });
			}
		});

		if (out) {
			markTl
				.to([markGlass, markEdge], { y: -30, opacity: 0, duration: .4, ease: "power2.in" })
				.set(markGlass, { y: 70 })
				.set(markEdge, { y: 70, filter: "blur(12px)" });
		}

		markTl
			.to(markGlass, { y: 0, opacity: 1, duration: 1.4 }, .7)
			.to(markEdge, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.4 }, .85);
	}

	// the pictures behind only follow the front one; which of them shows is set below (is-current)
	var back = new Swiper(".ag-hero-1-slider-back", {
		slidesPerView: 1,
		speed: 1000,
		allowTouchMove: false,
		effect: "fade",
		fadeEffect: { crossFade: true }
	});

	var swiper = new Swiper(".ag-hero-1-slider-front", {
		slidesPerView: 1,
		speed: 1000,
		rewind: true,
		effect: "fade",
		fadeEffect: { crossFade: true },
		controller: { control: back },
		autoplay: prefersReducedMotion() ? false : { delay: 5000, disableOnInteraction: false },
		on: {
			slideChange: function () {
				var now = this.activeIndex;
				var before = this.previousIndex;

				$thumbs.removeClass("is-active").eq(now).addClass("is-active");
				$current.text("0" + (now + 1));

				// the picture that goes out stays under the new one until the circle has covered it (without the animation it just goes)
				Array.prototype.forEach.call(backSlides, function (slide, n) {
					slide.classList.toggle("is-current", n === now);
					slide.classList.toggle("is-leaving", n === before && scenes.length > 0);
					unmask(slide);
				});

				if (!scenes.length) return;

				// a slide that is still opening when it is left is shown whole, it goes out under the new one
				if (scenes[before]) {
					if (scenes[before].tl) scenes[before].tl.kill();
					scenes[before].back.style.clipPath = "";
				}

				park(scenes[now]);
				serve(scenes[now], backSlides[before]);
				markServe(true);
			}
		}
	});

	$thumbs.on("click", function () {
		swiper.slideTo($thumbs.index(this));
	}).on("keydown", function (e) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			swiper.slideTo($thumbs.index(this));
		}
	});

	// the slider waits behind the preloader: the first slide is parked now, afterPreloader opens it and starts the slider
	agHero1Swiper = swiper;

	if (scenes.length) {
		swiper.autoplay.stop();
		park(scenes[0]);
		markPark();

		agHero1First = {
			play: function () {
				serve(scenes[0]);
				markServe(false);
			}
		};
	}
}



/*
	about-1 (AI Agentech) — when the parts scroll into view they come up like an AI system starting: the photo comes in through the
	liquid distortion (agLiquidImg2), the small card only comes down with the scroll, the key features card boots
	(the face comes out of a blur, the hand reaches in, the sparkles spin in one after another with their lines, the chip pops last).
	The tag and the 3d shapes of the background follow, the shapes also drift against the scroll. The title, the text and the button
	have their own effects (wa_text_effect, wow)
*/
function agAbout1In() {

	var area = document.querySelector(".ag-about-1-area");
	if (!area || prefersReducedMotion()) return;

	var tag = area.querySelector(".ag-about-1-sec-title > .ag-subtitle-1");
	var shapes = gsap.utils.toArray(".ag-about-1-bg-shape-1, .ag-about-1-bg-shape-2", area);

	gsap.from(tag, {
		x: -30,
		opacity: 0,
		filter: "blur(8px)",
		duration: 1,
		ease: "power3.out",
		clearProps: "transform,opacity,filter",
		scrollTrigger: { trigger: tag, start: "top 85%", once: true }
	});

	// the shapes keep their transform (the drift below uses it), only the blur and the fade are cleared
	gsap.from(shapes, {
		scale: .7,
		opacity: 0,
		filter: "blur(16px)",
		duration: 1.8,
		ease: "power3.out",
		stagger: .25,
		clearProps: "opacity,filter",
		scrollTrigger: { trigger: area, start: "top 75%", once: true }
	});

	shapes.forEach(function (shape, i) {
		gsap.fromTo(shape, { yPercent: i ? 8 : -8 }, {
			yPercent: i ? -8 : 8,
			ease: "none",
			scrollTrigger: { trigger: area, start: "top bottom", end: "bottom top", scrub: true }
		});
	});

	// small card: no entrance, it only comes down from above with the scroll (400px in the 676 x 822 stage, which is scaled per breakpoint) and is in place when the photo is centred
	var images = area.querySelector(".ag-about-1-images");
	var card = area.querySelector(".ag-about-1-card");

	if (images && card) {
		gsap.fromTo(card, { y: -400 }, {
			y: 0,
			ease: "none",
			scrollTrigger: { trigger: images, start: "top 80%", end: "center 40%", scrub: true }
		});
	}

	// key features card
	var key = area.querySelector(".ag-about-1-key");

	if (key) {
		var face = key.querySelector(".ag-about-1-key-face");
		var hand = key.querySelector(".ag-about-1-key-hand");
		var chip = key.querySelector(".ag-about-1-key-ai");
		var icons = gsap.utils.toArray(".ag-about-1-key-list .icon", key);
		var lines = gsap.utils.toArray(".ag-about-1-key-list .text", key);

		gsap.timeline({
			defaults: { ease: "power3.out" },
			scrollTrigger: { trigger: key, start: "top 85%", once: true },
			onComplete: function () {
				gsap.set(key, { clearProps: "opacity" });
				gsap.set([face, hand, chip].concat(icons, lines), { clearProps: "transform,opacity,filter" });
			}
		})
			.from(key, { opacity: 0, duration: .8 }, 0)
			.from(face, { x: -60, opacity: 0, filter: "blur(12px)", duration: 1.2 }, .1)
			.from(hand, { x: 90, rotate: 8, opacity: 0, transformOrigin: "100% 50%", duration: 1.2 }, .3)
			.from(icons, { scale: 0, rotate: -180, duration: .7, ease: "back.out(2)", stagger: .12 }, .5)
			.from(lines, { x: -28, opacity: 0, filter: "blur(6px)", duration: .8, stagger: .12 }, .5)
			.from(chip, { scale: .4, rotate: -25, opacity: 0, duration: .9, ease: "back.out(2.4)" }, 1.1);
	}
}


/*
	process-1 title — the big title sits behind the panel and rises out of it with the scroll: it is all hidden when the panel comes
	into the screen and is where the design has it when the panel is just over the middle (and goes back down when scrolled back).
	Only its margin-top moves (the title is centred by its transform, so a gsap y would fight it)
*/
function agProcess1Title() {
	var title = document.querySelector(".ag-process-1-title");
	var panel = document.querySelector(".ag-process-1-panel");
	if (!title || !panel || prefersReducedMotion()) return;

	// 55% of the title's own height is more than the 0.45em that shows above the panel, so all of it is behind the panel at the start
	gsap.fromTo(title, {
		marginTop: function () {
			return title.offsetHeight * .55;
		}
	}, {
		marginTop: 0,
		ease: "none",
		scrollTrigger: { trigger: panel, start: "top bottom", end: "top 55%", scrub: true, invalidateOnRefresh: true }
	});
}


/*
	cta-1 (AI Agentech) — when the box scrolls into view the robot comes up (from below, out of a blur) and right with it
	the neon lines open up behind it like a circle that grows from the centre of their box. The title, the text and the button come
	up one after another beside it
*/
function agCta1In() {

	var box = document.querySelector(".ag-cta-1-box");
	if (!box || prefersReducedMotion()) return;

	var robot = box.querySelector(".ag-cta-1-robot");
	var lines = box.querySelector(".ag-cta-1-lines");
	var rest = gsap.utils.toArray(".ag-cta-1-title, .ag-cta-1-text, .ag-cta-1-btn", box);

	if (!robot || !lines) return;

	gsap.timeline({
		defaults: { ease: "power3.out" },
		scrollTrigger: { trigger: box, start: "top 80%", once: true },
		onComplete: function () {
			gsap.set([robot, lines].concat(rest), { clearProps: "transform,opacity,filter,clipPath" });
		}
	})
		.from(robot, { y: 90, scale: .85, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 100%", duration: 1.2 }, 0)
		.from(rest, { y: 30, opacity: 0, filter: "blur(6px)", duration: .9, stagger: .15 }, .2)
		// the lines start right behind the robot (.2s later, it is already coming), the circle grows from their centre; 75% of the box is a little more than the way to a corner (71%), so it ends with all of them shown
		.fromTo(lines, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", duration: 1.6, ease: "power2.inOut" }, .2);
}


/*
	cta-2 (AI Agentech) — the tiles of the video open when it scrolls into view: every tile has a dark cover (the colour of the section) that folds
	away to its bottom edge, the covers go one after another from the middle of the grid (5 x 4) to its edges, and the video settles from a slight zoom
*/
function agCta2Video() {

	if (prefersReducedMotion()) return;

	var box = document.querySelector(".ag-cta-2-video");
	var video = document.querySelector(".ag-cta-2-video video");
	var tiles = gsap.utils.toArray(".ag-cta-2-video-tile");

	if (!box || !video || !tiles.length) return;

	gsap.timeline({
		scrollTrigger: { trigger: box, start: "top 80%", once: true },
		onComplete: function () {
			// back to the css (the covers are folded there)
			gsap.set(tiles.concat(video), { clearProps: "transform" });
		}
	})
		.fromTo(tiles, { scaleY: 1, transformOrigin: "50% 100%" }, { scaleY: 0, duration: .8, ease: "power3.inOut", stagger: { grid: [4, 5], from: "center", amount: .9 } }, 0)
		.fromTo(video, { scale: 1.15 }, { scale: 1, duration: 1.7, ease: "power2.out" }, 0);
}


/*
	footer-2 (AI Agentech) — the "Ai" mark builds itself when it scrolls into view: the arch of the A and the stem of the i grow up from the
	baseline, then the dot in the A and the dot of the i pop in (the mark is one svg in four parts, they share the gradient)
*/
function agFooter2Mark() {

	if (prefersReducedMotion()) return;

	var mark = document.querySelector(".ag-footer-2-mark");

	if (!mark) return;

	var arch = mark.querySelector(".ag-footer-2-mark-a");
	var stem = mark.querySelector(".ag-footer-2-mark-i");
	var inner = mark.querySelector(".ag-footer-2-mark-c");
	var dot = mark.querySelector(".ag-footer-2-mark-d");

	if (!arch || !stem || !inner || !dot) return;

	gsap.timeline({
		scrollTrigger: { trigger: mark, start: "top 85%", once: true },
		onComplete: function () {
			gsap.set([arch, stem, inner, dot], { clearProps: "transform,opacity" });
		}
	})
		.fromTo(arch, { scaleY: 0, opacity: 0, transformOrigin: "50% 100%" }, { scaleY: 1, opacity: 1, duration: 1.1, ease: "power3.out" }, 0)
		.fromTo(stem, { scaleY: 0, opacity: 0, transformOrigin: "50% 100%" }, { scaleY: 1, opacity: 1, duration: 1.1, ease: "power3.out" }, .15)
		.fromTo(inner, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: .7, ease: "back.out(2)" }, .75)
		.fromTo(dot, { scale: 0, y: -30, transformOrigin: "50% 50%" }, { scale: 1, y: 0, duration: .8, ease: "back.out(2.4)" }, .95);
}


/*
	pr-btn-2 (AI Agentech) — a light magnetic pull, like the header button of Hayler: while the pointer is on the arrow, its white box leans toward
	the pointer (up to 6px off the centre), and it goes back when the pointer leaves. The icon is the place that stays, the box is what moves
*/
function agPrBtn2Magnet() {

	if (prefersReducedMotion() || !window.matchMedia("(hover: hover)").matches) return;

	var strength = 12;

	document.querySelectorAll(".ag-pr-btn-2 .icon").forEach(function (icon) {
		var box = icon.querySelector(".icon-box");

		if (!box) return;

		icon.addEventListener("mousemove", function (e) {
			var r = icon.getBoundingClientRect();

			gsap.to(box, {
				x: ((e.clientX - r.left) / r.width - .5) * strength,
				y: ((e.clientY - r.top) / r.height - .5) * strength,
				duration: .3,
				ease: "power2.out",
				overwrite: "auto"
			});
		});

		icon.addEventListener("mouseleave", function () {
			gsap.to(box, { x: 0, y: 0, duration: .3, ease: "power2.out", overwrite: "auto" });
		});
	});
}


/*
	footer-1 (AI Agentech) — the robot powers on when its row scrolls into view: it comes up out of a blur and its light flickers
	like a hologram before it holds. The big brand text (its own trigger) rises out of a blur and its letters close in from a wide
	spacing, like a line being set
*/
function agFooter1In() {

	if (prefersReducedMotion()) return;

	var top = document.querySelector(".ag-footer-1-top");
	var robot = document.querySelector(".ag-footer-1-robot");

	if (top && robot) {
		gsap.set(robot, { opacity: 0 });

		gsap.timeline({
			defaults: { ease: "power3.out" },
			scrollTrigger: { trigger: top, start: "top 90%", once: true },
			onComplete: function () {
				gsap.set(robot, { clearProps: "transform,opacity,filter" });
			}
		})
			.from(robot, { y: 70, scale: .9, filter: "blur(10px)", transformOrigin: "50% 100%", duration: 1.2 }, 0)
			.to(robot, { opacity: .9, duration: .12, ease: "none" }, 0)
			.to(robot, { opacity: .15, duration: .1, ease: "none" })
			.to(robot, { opacity: 1, duration: .12, ease: "none" })
			.to(robot, { opacity: .4, duration: .1, ease: "none" })
			.to(robot, { opacity: 1, duration: .3, ease: "none" });
	}

	var brand = document.querySelector(".ag-footer-1-brand");
	var text = document.querySelector(".ag-footer-1-brand-text");

	if (brand && text) {
		// the em values are the same on both sides (-0.022em is the letter spacing of the design), so gsap has nothing to convert
		gsap.fromTo(text, {
			yPercent: 45,
			opacity: 0,
			filter: "blur(12px)",
			letterSpacing: "0.06em"
		}, {
			yPercent: 0,
			opacity: 1,
			filter: "blur(0px)",
			letterSpacing: "-0.022em",
			duration: 1.6,
			ease: "power3.out",
			clearProps: "transform,opacity,filter,letterSpacing",
			scrollTrigger: { trigger: brand, start: "top 90%", once: true }
		});
	}
}


// the card under the pointer (or the focus) is the lit one (the one that starts lit, as drawn in the design, has is-active in the html)
function agLitOnHover($cards) {
	$cards.on("mouseenter focusin", function () {
		$cards.removeClass("is-active");
		$(this).addClass("is-active");
	});
}


/*
	services-1 (AI Agentech) — the cards drag along the slider, the card under the pointer (or the focus) is the lit one
*/
function agServices1Slider() {

	if (!$(".ag-services-1-slider").length) return;

	new Swiper(".ag-services-1-slider", {
		slidesPerView: "auto",
		spaceBetween: 20,
		speed: 600,
		grabCursor: true
	});

	agLitOnHover($(".ag-services-1-card"));
}


/*
	team-1 (AI Agentech) — no card starts lit: the card under the pointer (or the focus) is lit (is-active) and goes back when the pointer leaves
*/
function agTeam1Cards() {
	$(".ag-team-1-card")
		.on("mouseenter focusin", function () {
			$(this).addClass("is-active");
		})
		.on("mouseleave focusout", function () {
			$(this).removeClass("is-active");
		});
}


/*
	features-1 (AI Agentech) — the slider has one picture for every item of the list: the item under the pointer (or the focus) is
	the lit one and brings its picture, a swipe on the slider lights the item of the picture that comes
*/
function agFeatures1Slider() {

	if (!$(".ag-features-1-slider").length) return;

	var $items = $(".ag-features-1-item");

	var swiper = new Swiper(".ag-features-1-slider", {
		slidesPerView: 1,
		spaceBetween: 2,
		speed: 700,
		grabCursor: true,
		on: {
			slideChange: function () {
				$items.removeClass("is-active").eq(this.activeIndex).addClass("is-active");
			}
		}
	});

	$items.on("mouseenter focusin", function () {
		swiper.slideTo($items.index(this));
	});
}


/*
	choose-2 (AI Agentech) — one photo for every card: the card under the pointer (or the focus) is the lit one and brings its photo to the front,
	the photos before it slide out to the left and the ones after it line up behind it (is-p0 is the first photo, is-p1.. the ones that follow,
	is-out the ones that have gone, the sizes and the slide are in css)
*/
function agChoose2Gallery() {

	var $cards = $(".ag-choose-2-card");
	var $pics = $(".ag-choose-2-pic");

	if (!$cards.length || !$pics.length) return;

	agLitOnHover($cards);

	$cards.on("mouseenter focusin", function () {
		var now = $cards.index(this);

		$pics.each(function (i) {
			var d = i - now;

			$(this).removeClass("is-out is-p0 is-p1 is-p2 is-p3").addClass(d < 0 ? "is-out" : "is-p" + d);
		});
	});
}


/*
	projects-1 (AI Agentech) — the cards run past both edges of the screen, the one in the middle is the lit one (the two next to it are
	grey and see-through, css), the arrows turn the slider and a click on a card next to it brings that card to the middle
*/
function agProjects1Slider() {

	if (!$(".ag-projects-1-slider").length) return;

	new Swiper(".ag-projects-1-slider", {
		slidesPerView: "auto",
		centeredSlides: true,
		spaceBetween: 16,
		initialSlide: 1,
		loop: true,
		speed: 700,
		grabCursor: true,
		slideToClickedSlide: true,
		breakpoints: {
			768: { spaceBetween: 24 },
			1200: { spaceBetween: 40 }
		},
		navigation: {
			prevEl: ".ag-projects-1-btn.prev",
			nextEl: ".ag-projects-1-btn.next"
		}
	});
}


/*
	projects-2 (AI Agentech) — from 992px up (and 640px high) the cards stick to the top of the screen one after the other (position: sticky,
	_projects.scss) and the card that is being covered shrinks to 0.9 and blurs to 8px while the next one slides over it: it starts when the
	next card touches its bottom edge and is done when the next card has come up to 30% of the card's height from the top (the effect of the
	project cards of novora-wbs.webflow.io). The place of the next card is read live, a trigger cannot measure a sticky card
*/
function agProjects2Stack() {

	// the section of the home 3 (.is-flow) is a plain list, it is not stacked
	var list = document.querySelector(".ag-projects-2-area:not(.is-flow) .ag-projects-2-list");
	var items = gsap.utils.toArray(".ag-projects-2-item");
	if (!list || items.length < 2 || prefersReducedMotion()) return;

	var cards = items.map(function (item) {
		return item.querySelector(".ag-projects-2-card");
	});

	var mm = gsap.matchMedia();

	mm.add("(min-width: 992px) and (min-height: 640px)", function () {

		var update = function () {
			items.forEach(function (item, i) {
				var next = items[i + 1];
				if (!next) return;

				var pin = parseFloat(getComputedStyle(item).top) || 0;
				var height = item.offsetHeight;
				// 0 while the next card is at the bottom edge of this one, 1 when it has come up to 30% of the height
				var p = gsap.utils.clamp(0, 1, (pin + height - next.getBoundingClientRect().top) / (height * 0.7));

				gsap.set(cards[i], {
					scale: 1 - 0.1 * p,
					filter: p > 0 ? "blur(" + (8 * p).toFixed(2) + "px)" : "none"
				});
			});
		};

		var trigger = ScrollTrigger.create({
			trigger: list,
			start: "top bottom",
			end: "bottom top",
			onUpdate: update,
			onRefresh: update
		});

		update();

		return function () {
			trigger.kill();
			gsap.set(cards, { clearProps: "transform,filter" });
		};
	});
}


/*
	faqs-2 (AI Agentech) — the section starts as one big picture (two halves of the same picture, _faqs.scss). From 1200px up (and 700px high)
	the section is pinned (a section that is taller than the screen is pinned by its bottom edge) and, while the page scrolls (scrubbed 0.6), the
	halves slide apart to the left and to the right and the questions come up between them. From 1200px up but lower than 700px nothing is pinned,
	the halves slide while the section comes up. A fifth of the screen of every half stays at the sides (400px on the 1920 design), but never so
	much that it would reach the questions. With reduced motion the halves are just put where they end. Below 1200px there is no animation and no
	picture: the halves are hidden in css, the section is the plain questions
*/
function agFaqs2Reveal() {

	var area = document.querySelector(".ag-faqs-2-area");
	if (!area) return;

	var left = area.querySelector(".ag-faqs-2-half.is-l");
	var right = area.querySelector(".ag-faqs-2-half.is-r");
	var wrap = area.querySelector(".ag-faqs-2-wrap");
	var list = area.querySelector(".ag-faqs-2-list");
	var top = area.querySelector(".ag-faqs-2-top");

	// how far a half slides: it is half of the section wide, the part that stays is a fifth of the section (nothing if it is only a sliver)
	var slide = function () {
		var width = area.offsetWidth;
		var content = Math.max(list.offsetWidth, top.offsetWidth);
		var visible = Math.min(width * 0.2083, (width - content) / 2 - 8);
		return width / 2 - (visible < 24 ? 0 : visible);
	};

	if (prefersReducedMotion()) {
		gsap.set(left, { x: function () { return -slide(); } });
		gsap.set(right, { x: function () { return slide(); } });
		return;
	}

	var build = function (tl) {
		tl.fromTo(left, { x: 0 }, { x: function () { return -slide(); }, duration: 1, ease: "power2.inOut" }, 0);
		tl.fromTo(right, { x: 0 }, { x: function () { return slide(); }, duration: 1, ease: "power2.inOut" }, 0);
		// the questions come up from below the section (the section cuts them off), one to one with the scroll: they start when the halves have
		// slid 60% of the way and are in place a little after the halves are done
		tl.fromTo(wrap, { y: function () { return area.offsetHeight; } }, { y: 0, duration: 0.9, ease: "none" }, 0.6);
	};

	var mm = gsap.matchMedia();

	mm.add("(min-width: 1200px) and (min-height: 700px)", function () {
		build(gsap.timeline({
			scrollTrigger: {
				trigger: area,
				start: function () {
					return area.offsetHeight > window.innerHeight ? "bottom bottom" : "top top";
				},
				end: "+=110%",
				pin: true,
				scrub: 0.6,
				anticipatePin: 1,
				invalidateOnRefresh: true,
				// measured before the other triggers, like the pin of the team section (the titles under it count the space it adds)
				refreshPriority: 1
			}
		}));
	});

	mm.add("(min-width: 1200px) and (max-height: 699px)", function () {
		build(gsap.timeline({
			scrollTrigger: {
				trigger: area,
				start: "top 80%",
				end: "top 10%",
				scrub: 0.6,
				invalidateOnRefresh: true
			}
		}));
	});
}

// the question that is open tells the screen readers (wa_accordion_item in main-common.js only moves the .active class)
$(document).on("click", ".ag-faqs-2-item", function () {
	$(".ag-faqs-2-item").each(function () {
		$(this).find(".ag-faqs-2-head").attr("aria-expanded", $(this).hasClass("active"));
	});
});


/*
	hero-2 (AI Agentech) — the card on the left is a slider of three (the picture and the number fade into each other, the dots and the round
	arrow stay where they are): it turns by itself, the arrow brings the next one and a dot brings its own slide
*/
function agHero2Slider() {

	if (!$(".ag-hero-2-slider").length) return;

	var $dots = $(".ag-hero-2-dots .dot");

	var swiper = new Swiper(".ag-hero-2-slider", {
		slidesPerView: 1,
		loop: true,
		speed: 700,
		effect: "fade",
		fadeEffect: { crossFade: true },
		grabCursor: true,
		autoplay: prefersReducedMotion() ? false : { delay: 4000, disableOnInteraction: false },
		navigation: { nextEl: ".ag-hero-2-next" },
		on: {
			slideChange: function () {
				$dots.removeClass("is-active").eq(this.realIndex).addClass("is-active");

				if (prefersReducedMotion()) return;

				// the picture of the new slide settles into its frame: it starts zoomed in and a little to the side and glides to its place while the
				// slides cross-fade
				var img = this.slides[this.activeIndex].querySelector(".ag-hero-2-card-img img");

				if (img) {
					gsap.fromTo(img, { scale: 1.3, xPercent: 6 }, {
						scale: 1,
						xPercent: 0,
						duration: 1.6,
						ease: "power3.out",
						overwrite: true,
						clearProps: "transform"
					});
				}
			}
		}
	});

	$dots.on("click", function () {
		swiper.slideToLoop($dots.index(this));
	});
}


/*
	hero-2 (AI Agentech) — built in order right after the preloader: the two colours fade in, the logo mark and the words of the title come up
	(the words from behind their line), the text and the button follow, the dark panel rises, the robot climbs out of the bottom of it and, once it
	stands, its light switches on (it flickers like a lamp before it holds). The ghost title, the star, the round button and the two cards come in
	around them. After that the robot leans a little left / right with the pointer while the pointer is over the hero
*/
var agHero2First = null;

function agHero2Intro() {

	var area = document.querySelector(".ag-hero-2-area");

	if (!area || prefersReducedMotion()) return;

	var q = function (selector) {
		return area.querySelector(selector);
	};

	var title = q(".ag-hero-2-title");
	var words = title ? agHeroWords(title, "ag-hero-2-word-mask", "ag-hero-2-word") : [];
	var rest = gsap.utils.toArray(".ag-hero-2-text, .ag-pr-btn-2", q(".ag-hero-2-wrap"));
	var colours = gsap.utils.toArray(".ag-hero-2-bg-clr-1, .ag-hero-2-bg-clr-2", area);
	var fav = q(".ag-hero-2-fav");
	var tab = q(".ag-hero-2-tab");
	var agency = q(".ag-hero-2-agency");
	var star = q(".ag-hero-2-star");
	var panel = q(".ag-hero-2-panel");
	var robot = q(".ag-hero-2-robot");
	var robotImg = q(".ag-hero-2-robot-img");
	var light = q(".ag-hero-2-robot-light");
	var explore = q(".ag-hero-2-explore");
	var card = q(".ag-hero-2-card");
	var video = q(".ag-hero-2-video-card");

	var all = [].concat(colours, words, rest, [fav, tab, agency, star, panel, robotImg, light, explore, card, video]).filter(Boolean);

	// parked: everything waits for its turn. The robot waits under the bottom edge of the panel (the clip of the panel cuts it off there)
	// the two blurred colours wait a hair above 0, not at 0: they are drawn (the big blur is worked out) now, behind the preloader, and not at the first
	// frame of their fade, where it would make the page stutter. The blur is also left off the big pieces (the mark with its video, the ghost title)
	gsap.set(colours, { opacity: .001 });
	gsap.set(fav, { scale: .6, opacity: 0, transformOrigin: "0% 100%" });
	gsap.set(words, { yPercent: 115, rotate: 5, opacity: 0, filter: "blur(10px)", transformOrigin: "0% 100%" });
	gsap.set(rest, { y: 28, opacity: 0, filter: "blur(6px)" });
	gsap.set(agency, { y: 60, opacity: 0 });
	gsap.set(tab, { scaleX: .2, opacity: 0, transformOrigin: "0% 50%" });
	gsap.set(star, { scale: 0, rotate: -180, opacity: 0 });
	gsap.set(panel, { y: 110, opacity: 0 });
	gsap.set(robotImg, { yPercent: 100 });
	gsap.set(light, { opacity: 0 });
	gsap.set(explore, { scale: .4, opacity: 0 });
	gsap.set(card, { y: 90, opacity: 0 });
	gsap.set(video, { y: 70, opacity: 0 });

	agHero2First = {
		play: function () {
			gsap.timeline({
				defaults: { ease: "power3.out" },
				onComplete: function () {
					gsap.set(all, { clearProps: "transform,opacity,filter" });
				}
			})
				.to(colours[0], { opacity: 1, duration: 1.8, ease: "power2.out" }, 0)
				// the lilac colour on the right comes in a little later
				.to(colours[1], { opacity: 1, duration: 2, ease: "power2.out" }, 1.3)
				.to(fav, { scale: 1, opacity: 1, duration: 1.2 }, .15)
				.to(agency, { y: 0, opacity: 1, duration: 1.4 }, .3)
				.to(panel, { y: 0, opacity: 1, duration: 1.4 }, .3)
				.to(words, { yPercent: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger: .08 }, .35)
				.to(robotImg, { yPercent: 0, duration: 1.7 }, .8)
				.to(rest, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: .15 }, .9)
				.to(card, { y: 0, opacity: 1, duration: 1.3 }, 1)
				.to(star, { scale: 1, rotate: 0, opacity: 1, duration: 1.3, ease: "back.out(1.7)" }, 1.1)
				.to(tab, { scaleX: 1, opacity: 1, duration: .9 }, 1.2)
				.to(video, { y: 0, opacity: 1, duration: 1.2 }, 1.25)
				.to(explore, { scale: 1, opacity: 1, duration: 1, ease: "back.out(1.7)" }, 1.3)
				// the light of the robot switches on once it stands: a lamp that flickers before it holds
				.to(light, { opacity: .9, duration: .1, ease: "none" }, 2.35)
				.to(light, { opacity: .1, duration: .09, ease: "none" })
				.to(light, { opacity: 1, duration: .12, ease: "none" })
				.to(light, { opacity: .35, duration: .08, ease: "none" })
				.to(light, { opacity: 1, duration: .6, ease: "power2.out" });
		}
	};

	// the robot (its picture and its light together) leans a little with the pointer, left and right (28px from one side of the hero to the other)
	if (robot && window.matchMedia("(hover: hover)").matches) {
		var lean = gsap.quickTo(robot, "x", { duration: .9, ease: "power3.out" });

		area.addEventListener("mousemove", function (e) {
			var r = area.getBoundingClientRect();

			lean(((e.clientX - r.left) / r.width - .5) * 28);
		});

		area.addEventListener("mouseleave", function () {
			lean(0);
		});
	}
}


/*
	hero-3 (AI Agentech) — built in order right after the preloader: the video fades up out of a zoom, the words of the title come up from behind
	their line (the text and the button follow), the social links slide in from the left, then the two cards rise: the avatars, the number and the
	plus pop in on the card of the clients
*/
var agHero3First = null;

function agHero3Intro() {

	var area = document.querySelector(".ag-hero-3-area");

	if (!area || prefersReducedMotion()) return;

	var q = function (selector) {
		return area.querySelector(selector);
	};

	var title = q(".ag-hero-3-title");
	var words = title ? agHeroWords(title, "ag-hero-3-word-mask", "ag-hero-3-word") : [];
	var rest = gsap.utils.toArray(".ag-hero-3-text, .ag-pr-btn-3", area);
	var panel = q(".ag-hero-3-panel");
	var video = q(".ag-hero-3-video");
	var social = gsap.utils.toArray(".ag-hero-3-social .title, .ag-hero-3-social .links a", area);
	var line = q(".ag-hero-3-social .line");
	var feature = q(".ag-hero-3-feature");
	var items = gsap.utils.toArray(".ag-hero-3-feature-item", area);
	var trust = q(".ag-hero-3-trust");
	var avatars = gsap.utils.toArray(".ag-hero-3-trust-avatars .item", area);
	var count = q(".ag-hero-3-trust-count");
	var plus = q(".ag-hero-3-trust-count .plus");
	var info = q(".ag-hero-3-trust-text");

	var all = [].concat(words, rest, social, items, avatars, [panel, video, line, feature, trust, count, plus, info]).filter(Boolean);

	// parked: everything waits for its turn
	gsap.set(panel, { opacity: 0 });
	gsap.set(video, { scale: 1.2 });
	gsap.set(words, { yPercent: 115, rotate: 5, opacity: 0, filter: "blur(10px)", transformOrigin: "0% 100%" });
	gsap.set(rest, { y: 28, opacity: 0, filter: "blur(6px)" });
	gsap.set(social, { x: -24, opacity: 0 });
	gsap.set(line, { scaleY: 0, transformOrigin: "50% 0%" });
	gsap.set(feature, { y: 80, opacity: 0 });
	gsap.set(items, { y: 16, opacity: 0 });
	gsap.set(trust, { y: 110, opacity: 0 });
	gsap.set(avatars, { scale: .4, x: -18, opacity: 0 });
	gsap.set(count, { y: 24, opacity: 0 });
	gsap.set(plus, { scale: 0 });
	gsap.set(info, { y: 20, opacity: 0 });

	agHero3First = {
		play: function () {
			gsap.timeline({
				defaults: { ease: "power3.out" },
				onComplete: function () {
					gsap.set(all, { clearProps: "transform,opacity,filter" });
				}
			})
				.to(panel, { opacity: 1, duration: 1, ease: "power2.out" }, 0)
				.to(video, { scale: 1, duration: 2.4, ease: "power2.out" }, 0)
				.to(words, { yPercent: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger: .08 }, .4)
				.to(rest, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: .15 }, 1)
				.to(social, { x: 0, opacity: 1, duration: .9, stagger: .08 }, 1)
				.to(line, { scaleY: 1, duration: 1 }, 1.1)
				.to(feature, { y: 0, opacity: 1, duration: 1.2 }, 1.1)
				.to(trust, { y: 0, opacity: 1, duration: 1.3 }, 1.3)
				.to(items, { y: 0, opacity: 1, duration: .8, stagger: .12 }, 1.5)
				.to(avatars, { scale: 1, x: 0, opacity: 1, duration: .8, stagger: .1, ease: "back.out(1.7)" }, 1.9)
				.to(count, { y: 0, opacity: 1, duration: 1 }, 2.05)
				.to(info, { y: 0, opacity: 1, duration: .9 }, 2.2)
				.to(plus, { scale: 1, duration: .8, ease: "back.out(2)" }, 2.4);
		}
	};
}


/*
	gallery-3 (AI Agentech) — when the pictures scroll into view they come up one after another, from the middle column out to the two outer ones (a
	picture rises, grows from a little smaller and fades in while the photo inside it settles from a zoom), then the button of the middle picture pops
	in. From 1400 up the grid plays as a whole when it comes into view, below it every picture waits for its own turn on the screen (the rows that wrap
	are not played before they are seen). The tag over the title comes up first, the title has its own effect (wa_text_effect)
*/
function agGallery3In() {

	var area = document.querySelector(".ag-gallery-3-area");

	if (!area || prefersReducedMotion()) return;

	var tag = area.querySelector(".ag-gallery-3-sec-title > .ag-subtitle-1");
	var grid = area.querySelector(".ag-gallery-3-grid");
	var cols = gsap.utils.toArray(".ag-gallery-3-col", area);
	var items = gsap.utils.toArray(".ag-gallery-3-item", area);
	var mid = area.querySelector(".ag-gallery-3-item.is-4");
	var btn = area.querySelector(".ag-gallery-3-btn .ag-pr-btn-3");

	if (!grid || !items.length) return;

	// the turn of a picture: the middle column first, then the two next to it, then the outer two; the pictures of a column follow one another from the top
	cols.forEach(function (col, c) {
		gsap.utils.toArray(".ag-gallery-3-item", col).forEach(function (item, i) {
			item._turn = Math.abs(c - (cols.length - 1) / 2) * 2 + i * .5;
		});
	});

	var imgs = items.map(function (item) {
		return item.querySelector("img");
	});

	// parked: the pictures wait low and small, the photos inside them zoomed in (the box cuts the zoom off), the button waits small
	gsap.set(items, { y: 90, scale: .9, opacity: 0, transformOrigin: "50% 100%" });
	gsap.set(imgs, { scale: 1.3 });
	if (btn) gsap.set(btn, { scale: .5, opacity: 0 });

	function play(batch) {
		var first = Math.min.apply(null, batch.map(function (item) {
			return item._turn;
		}));
		var wait = function (i, item) {
			return (item._turn - first) * .09;
		};

		gsap.to(batch, { y: 0, scale: 1, opacity: 1, duration: 1.2, ease: "power3.out", delay: wait, clearProps: "transform,opacity" });
		gsap.to(batch.map(function (item) {
			return item.querySelector("img");
		}), { scale: 1, duration: 1.8, ease: "power2.out", delay: function (i) {
			return wait(i, batch[i]);
		}, clearProps: "transform" });

		if (btn && batch.indexOf(mid) > -1) {
			gsap.to(btn, { scale: 1, opacity: 1, duration: .8, ease: "back.out(1.7)", delay: wait(0, mid) + .9, clearProps: "transform,opacity" });
		}
	}

	var mm = gsap.matchMedia();

	mm.add("(min-width: 1400px)", function () {
		ScrollTrigger.create({ trigger: grid, start: "top 75%", once: true, onEnter: function () {
			play(items);
		} });
	});

	mm.add("(max-width: 1399px)", function () {
		ScrollTrigger.batch(items, { start: "top 88%", once: true, onEnter: play });
	});

	if (tag) {
		gsap.from(tag, {
			y: 24,
			opacity: 0,
			filter: "blur(8px)",
			duration: 1,
			ease: "power3.out",
			clearProps: "transform,opacity,filter",
			scrollTrigger: { trigger: tag, start: "top 85%", once: true }
		});
	}
}


/*
	clients-2 (AI Agentech) — when the section comes into view the glass ribbon slides in from the upper right (turning, out of a blur) and settles
	over the end of the title, then it floats a little all the time
*/
function agClients2Shape() {

	var area = document.querySelector(".ag-clients-2-area");
	var shape = area ? area.querySelector(".ag-clients-2-shape") : null;

	if (!shape || prefersReducedMotion()) return;

	gsap.fromTo(shape, { x: 140, y: -60, rotate: 14, scale: .8, opacity: 0, filter: "blur(14px)" }, {
		x: 0,
		y: 0,
		rotate: 0,
		scale: 1,
		opacity: 1,
		filter: "blur(0px)",
		duration: 1.7,
		ease: "power3.out",
		scrollTrigger: { trigger: area, start: "top 70%", once: true },
		onComplete: function () {
			gsap.set(shape, { clearProps: "filter" });
			gsap.to(shape, { y: 10, rotate: 1.5, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
		}
	});
}


/*
	about-2 (AI Agentech) — the collage is built piece by piece WITH the scroll (scrubbed, it runs back when the page is scrolled back up). The box of
	the collage cuts off what is outside it, so, in two pairs: the light block (1) comes down from the top edge and the lilac card (4) with its round
	picture slides out from under its bottom edge, then the girl picture (2) comes down from the top edge and the picture under it (3) slides out from
	under its bottom edge
*/
function agAbout2Collage() {

	var box = document.querySelector(".ag-about-2-collage-box");

	if (!box || prefersReducedMotion()) return;

	var q = function (selector) {
		return box.querySelector(selector);
	};

	var fade = q(".ag-about-2-fade");
	var card = q(".ag-about-2-card");
	var cardParts = gsap.utils.toArray(".ag-about-2-card-logo, .ag-about-2-card-avatars, .ag-about-2-card-text", box);
	var brain = q(".ag-about-2-brain");
	var pic1 = q(".ag-about-2-pic-1");
	var pic2 = q(".ag-about-2-pic-2");

	if (!fade || !card || !brain || !pic1 || !pic2) return;

	// the pixels of y are the pixels of the board (472 x 744), which is scaled as a whole. The timeline is 1.15 long, the scroll runs it from the moment
	// the top of the collage is 90% down the screen until it is 5% down. The tweens are linear (ease none): the page scroll is already smoothed (Lenis)
	// and so is the scrub, an ease on top of them makes every piece rush off and brake, which shows as a shake when the pieces follow one another
	gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: { trigger: box, start: "top 90%", end: "top 5%", scrub: 1 }
	})
		.fromTo(fade, { yPercent: -105 }, { yPercent: 0, duration: .28 }, 0)
		// the same on the right: the lilac card and its round picture start hidden behind the light block (the block is over them, z-index in the css)
		// and slide down out from under its lower edge. They fade in while still behind it, so the corner of the card that would show at the rounded
		// corner of the block is not seen
		.fromTo([card, brain], { y: -437 }, { y: 0, duration: .3 }, .24)
		.fromTo([card, brain], { opacity: 0 }, { opacity: 1, duration: .08, ease: "none" }, .24)
		.fromTo(cardParts, { opacity: 0 }, { opacity: 1, duration: .15, stagger: .04 }, .4)
		// the girl picture comes down from over the top edge (it is 579px from the top edge to its lower edge)
		.fromTo(pic1, { y: -600 }, { y: 0, duration: .3 }, .55)
		// the last picture starts hidden behind the girl picture and slides down out from under its lower edge (it only fades in while it is still
		// behind it, so the corner of it that would show at the rounded corner of the girl picture is not seen)
		.fromTo(pic2, { y: -240 }, { y: 0, duration: .3 }, .85)
		.fromTo(pic2, { opacity: 0 }, { opacity: 1, duration: .08, ease: "none" }, .85);
}


/*
	team-1 scroll — from 1200px up the section is pinned and the cards slide in from the right edge of their
	box (.ag-team-1-overflow, it cuts them off) while the page scrolls (the row as a block, every card a little behind the one before it,
	scrubbed 0.6), then they rest for a moment and the page goes on. The top of the section comes up once when it arrives.
	Below 1200 there is no animation at all
*/
function agTeam1Scroll() {

	var area = document.querySelector(".ag-team-1-area");
	if (!area || prefersReducedMotion()) return;

	var top = area.querySelector(".ag-team-1-top");
	var box = area.querySelector(".ag-team-1-overflow");
	var row = area.querySelector(".ag-team-1-cards");
	var cards = gsap.utils.toArray(".ag-team-1-card", area);

	var mm = gsap.matchMedia();

	mm.add("(min-width: 1200px) and (min-height: 700px)", function () {
		// the pinned section fills the screen (see _team.scss), a section that is taller than the screen is pinned by its bottom edge
		area.classList.add("has-pin");

		gsap.from(top, {
			y: 60,
			opacity: 0,
			duration: 1,
			ease: "power3.out",
			scrollTrigger: { trigger: area, start: "top 75%", once: true }
		});

		var tl = gsap.timeline({
			scrollTrigger: {
				trigger: area,
				start: function () {
					return area.offsetHeight > window.innerHeight ? "bottom bottom" : "top top";
				},
				end: "+=150%",
				pin: true,
				scrub: 0.6,
				anticipatePin: 1,
				invalidateOnRefresh: true,
				// measured before the other triggers: the wa_text_effect titles under the section (main-common.js) are made before this pin,
				// so without it they do not count the space it adds and play a screen and a half before their title comes
				refreshPriority: 1
			}
		});

		tl.fromTo(row, {
			x: function () {
				return box.offsetWidth;
			}
		}, {
			x: 0,
			duration: 0.8,
			ease: "none"
		}, 0);

		tl.fromTo(row, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, 0);

		tl.fromTo(cards, {
			x: function (i) {
				return i * 120;
			}
		}, {
			x: 0,
			duration: 0.8,
			ease: "power1.out"
		}, 0);

		// the cards rest where they are for the last fifth of the pin
		tl.to({}, { duration: 0.2 });

		return function () {
			area.classList.remove("has-pin");
		};
	});
}


/*
	wa_liquid_img2 — the image comes in through a liquid distortion: pixi draws it through a displacement map that settles from -400
	to 0 once the image is 30% in view and then keeps drifting. Needs pixi.min.js; the map file comes from data-displacement (no image
	in js), without it the plain <img> stays. The box takes its size from its parent, use class="wa_liquid_img2" instead of the id when
	it is used more than once:
	<div id="wa_liquid_img2" class="w-100 h-100 wa-fix" data-displacement="assets/img/common/liquid-displacement.png"><img src="..." alt=""></div>
*/
function agLiquidImg2() {

	var boxes = document.querySelectorAll("#wa_liquid_img2, .wa_liquid_img2");
	if (!boxes.length || typeof PIXI === "undefined" || prefersReducedMotion()) return;

	function liquid(box) {
		var img = box.querySelector("img");
		var mapURL = box.getAttribute("data-displacement");
		if (!img || !mapURL) return;

		var imgURL = img.getAttribute("src");
		img.remove();

		// the layout size (offsetWidth), not getBoundingClientRect: the box can sit inside a scaled stage (about-1) and the canvas is scaled with it
		var app = new PIXI.Application({
			width: box.offsetWidth,
			height: box.offsetHeight,
			transparent: true,
			autoDensity: true,
			resolution: window.devicePixelRatio
		});
		app.view.style.display = "block";
		app.view.style.pointerEvents = "none";
		box.appendChild(app.view);

		app.loader
			.add("hero", imgURL)
			.add("map", mapURL)
			.load(function (loader, res) {
				var container = new PIXI.Container();
				app.stage.addChild(container);

				var hero = new PIXI.Sprite(res.hero.texture);
				container.addChild(hero);

				// cover the box: the image fills it and what overflows is cropped, centred
				function fit() {
					var w = box.offsetWidth;
					var h = box.offsetHeight;
					if (!w || !h) return;

					app.renderer.resize(w, h);
					hero.scale.set(Math.max(w / hero.texture.width, h / hero.texture.height));
					hero.x = (w - hero.width) / 2;
					hero.y = (h - hero.height) / 2;
				}
				fit();

				// the box can change size after the first measure (breakpoints, fonts, layout shifts)
				if ("ResizeObserver" in window) {
					new ResizeObserver(fit).observe(box);
				}

				var map = new PIXI.Sprite(res.map.texture);
				map.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
				map.scale.set(2);

				var filter = new PIXI.filters.DisplacementFilter(map);
				filter.scale.x = -400;
				filter.scale.y = -400;

				app.stage.addChild(map);
				container.filters = [filter];

				var drift = false;
				app.ticker.add(function () {
					if (drift) {
						map.x += 1;
						map.y += 1;
					}
				});

				box._liquidPlay = function () {
					gsap.to(filter.scale, {
						x: 0,
						y: 0,
						duration: 2,
						ease: "expo.out",
						onComplete: function () {
							drift = true;
						}
					});
				};

				// it was already 30% in view while the files were still loading
				if (box._liquidSeen) box._liquidPlay();
			});
	}

	var observer = new IntersectionObserver(function (entries, obs) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;

			entry.target._liquidSeen = true;
			if (entry.target._liquidPlay) entry.target._liquidPlay();
			obs.unobserve(entry.target);
		});
	}, { threshold: 0.3 });

	boxes.forEach(function (box) {
		liquid(box);
		observer.observe(box);
	});
}


/*
	page lifecycle
*/
function afterPreloader() {
	if (agHero1First) agHero1First.play();
	if (agHero2First) agHero2First.play();
	if (agHero3First) agHero3First.play();
	if (agHero1Swiper && !prefersReducedMotion()) agHero1Swiper.autoplay.start();

	// the titles that waited behind the curtain (wa_text_effect with data-wa-text-wait, see main-common.js) come in now
	(window.waTextEffectWaiting || []).forEach(function (tl) {
		tl.play();
	});
}

function afterPageLoad() {
	if ($(".wow").length) {
		new WOW({
			boxClass: "wow",
			animateClass: "animated",
			offset: 100,
			mobile: true,
			live: true
		}).init();
	}
}

window.addEventListener("load", function () {

	ScrollTrigger.refresh();

	if (agPreloader) {
		agPreloader.done();
	} else {
		afterPreloader();
	}

	afterPageLoad();
});

// a trigger on a timeline (wa_text_effect in main-common.js) is measured a moment after it is made; when the page is
// reloaded halfway down, the next trigger that is made would measure and kill the passed ones all at once and ScrollTrigger
// loses count (reading 'pin' of undefined), so they are measured first
ScrollTrigger.refresh();

agHero1Slider();
agHero2Slider();
agHero2Intro();
agHero3Intro();
agGallery3In();
agClients2Shape();
agAbout2Collage();
agAbout1In();
agServices1Slider();
agTeam1Cards();
agTeam1Scroll();
agFeatures1Slider();
agProjects1Slider();
agProjects2Stack();
agFaqs2Reveal();
agChoose2Gallery();
agProcess1Title();
agCta1In();
agCta2Video();
agFooter1In();
agFooter2Mark();
agPrBtn2Magnet();
agLiquidImg2();

})(jQuery);

