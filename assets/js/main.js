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

		var tl = gsap.timeline();

		tl.to(loader, {
			opacity: 0,
			duration: .8,
			ease: "power2.inOut"
		});

		// the intro starts while the panel is still fading
		tl.call(afterPreloader, null, .3);
		tl.call(function () {
			loader.remove();
		}, null, .85);
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
	about-1 (AI Agentech) — when the parts scroll into view they come up like an AI system starting: the photo is drawn by a scan line
	that runs down it (out of a blur, a little zoomed), the small card rises and its number counts up, the key features card boots
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

	// photo + small card: the line and the photo run down together (same time, same ease), so the line is always at the edge of what is drawn
	var images = area.querySelector(".ag-about-1-images");
	var photo = area.querySelector(".ag-about-1-img img");
	var scan = area.querySelector(".ag-about-1-img-scan");
	var card = area.querySelector(".ag-about-1-card");
	var num = area.querySelector(".ag-about-1-card-num");

	if (images && photo && scan && card && num) {
		var goal = parseInt(num.textContent, 10);
		var unit = num.textContent.replace(/[\d\s]/g, "");
		var count = { v: 0 };

		num.textContent = "0" + unit;

		gsap.timeline({
			defaults: { ease: "power3.out" },
			scrollTrigger: { trigger: images, start: "top 78%", once: true },
			onComplete: function () {
				gsap.set([photo, card], { clearProps: "transform,opacity,filter,clipPath" });
			}
		})
			.fromTo(scan, { top: "0%" }, { top: "100%", duration: 1.6, ease: "power2.inOut" }, 0)
			.fromTo(scan, { opacity: 0 }, { opacity: 1, duration: .2, ease: "none" }, 0)
			.to(scan, { opacity: 0, duration: .3, ease: "none" }, 1.3)
			.fromTo(photo, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power2.inOut" }, 0)
			.fromTo(photo, { scale: 1.15, filter: "blur(14px) saturate(1.8)" }, { scale: 1, filter: "blur(0px) saturate(1)", duration: 2, ease: "power2.out" }, 0)
			.from(card, { y: 70, scale: .88, opacity: 0, transformOrigin: "0% 100%", duration: 1.2 }, .9)
			.to(count, {
				v: goal,
				duration: 1.6,
				ease: "power1.out",
				onUpdate: function () {
					num.textContent = Math.round(count.v) + unit;
				}
			}, 1.1);
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
	cta-1 (AI Agentech) — when the box scrolls into view the robot comes up first (from below, out of a blur), and only when it is there
	the neon lines fade in behind it. The title, the text and the button come up one after another beside it
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
			gsap.set([robot, lines].concat(rest), { clearProps: "transform,opacity,filter" });
		}
	})
		.from(robot, { y: 90, scale: .85, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 100%", duration: 1.2 }, 0)
		.from(rest, { y: 30, opacity: 0, filter: "blur(6px)", duration: .9, stagger: .15 }, .2)
		// the lines wait for the robot (it takes 1.2s)
		.from(lines, { opacity: 0, duration: 1.4, ease: "power2.out" }, 1.2);
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
	team-1 (AI Agentech) — the card under the pointer (or the focus) is the lit one
*/
function agTeam1Cards() {
	agLitOnHover($(".ag-team-1-card"));
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
	testimonial-1 (AI Agentech) — the cards run out to both edges of the screen, the first one starts cut by the left edge (slidesOffsetBefore,
	the less room the less is cut), they loop and play by themselves (stop while the pointer is on them) and drag
*/
function agTestimonial1Slider() {

	if (!$(".ag-testimonial-1-slider").length) return;

	new Swiper(".ag-testimonial-1-slider", {
		slidesPerView: "auto",
		spaceBetween: 16,
		slidesOffsetBefore: 36,
		loop: true,
		loopAdditionalSlides: 2,
		speed: 700,
		grabCursor: true,
		autoplay: prefersReducedMotion() ? false : { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
		breakpoints: {
			768: { spaceBetween: 20, slidesOffsetBefore: 48 },
			992: { slidesOffsetBefore: 60 },
			1200: { slidesOffsetBefore: -60 },
			1400: { slidesOffsetBefore: -120 },
			1600: { slidesOffsetBefore: -202 }
		}
	});
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
	page lifecycle
*/
function afterPreloader() {
	if (agHero1First) agHero1First.play();
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
agAbout1In();
agServices1Slider();
agTeam1Cards();
agTeam1Scroll();
agFeatures1Slider();
agProjects1Slider();
agTestimonial1Slider();
agProcess1Title();
agCta1In();
agFooter1In();

})(jQuery);

