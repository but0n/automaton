import genColors from "./colors";
import genImages from "./images";

import Interpolator from "./interpolator";

// ------

let colors;
let images;

let dist = ( _x1, _y1, _x2, _y2 ) => {
	let dx = _x2 - _x1;
	let dy = _y2 - _y1;
	return Math.sqrt( dx * dx + dy * dy );
};

let el = ( _tagorel, _styles, _parent ) => {
	let e = null;
	if ( typeof _tagorel === "string" ) {
		e = document.createElement( _tagorel );
	} else {
		e = _tagorel;
	}

	for ( let k in _styles ) {
		e.style[ k ] = _styles[ k ];
	}

	if ( _parent ) {
		_parent.appendChild( e );
	}

	return e;
};

// ------

let Inspector = () => {
	let inspector = {};
	let text = "";

	let mouseX = 0;
	let mouseY = 0;

	inspector.el = el( "div", {
		position: "fixed",
		padding: "2px",
		pointerEvents: "none",

		font: "300 12px Helvetica Neue, sans-serif",

		background: "#000",
		color: "#fff",
		opacity: "0.0"
	} );

	window.addEventListener( "mousemove", ( _event ) => {
		mouseX = _event.clientX;
		mouseY = _event.clientY;
	} );

	inspector.add = ( _el, _text, _delay ) => {
		let on = false;
		let id = 0;
		let stack = 0;
		let delay = typeof _delay === "number" ? _delay : 1.0;

		let onenter = ( _event ) => {
			stack ++;
			if ( stack !== 1 ) { return; }

			on = true;
			id ++;
			let cid = id;

			text = _text;

			setTimeout( () => {
				if ( on && id === cid ) {
					el( inspector.el, {
						opacity: "0.8"
					} );
				}
			}, delay * 1000.0 );
		};
		_el.addEventListener( "mouseenter", onenter );

		let onleave = ( _event ) => {
			stack --;
			if ( stack !== 0 ) { return; }

			on = false;

			el( inspector.el, {
				opacity: "0.0"
			} );
		}
		_el.addEventListener( "mouseleave", onleave );

		let onmousedown = ( _event ) => {
			on = false;

			el( inspector.el, {
				opacity: "0.0"
			} );
		};
		_el.addEventListener( "mousedown", onmousedown );

		return () => {
			_el.removeEventListener( "mouseenter", onenter );
			_el.removeEventListener( "mouseleave", onleave );
		};
	};

	let update = () => {
		if ( typeof text === "function" ) {
			inspector.el.innerText = text();
		} else {
			inspector.el.innerText = text;
		}

		let wid = inspector.el.clientWidth;
		let flip = ( window.innerWidth - mouseX ) < wid + 10;
		let attr = {
			left: mouseX + ( flip ? - wid - 10 : 10 ) + "px",
			top: mouseY - 15 + "px"
		};
		el( inspector.el, attr );

		requestAnimationFrame( update );
	};
	update();

	return inspector;
};

// ------

let AutomatonGUI = ( _automaton ) => {
	let gui = {};

	gui.automaton = _automaton;

	// ------

	colors = genColors();
  images = genImages();

	gui.inspector = Inspector();

	// ------

	let GUI_HEIGHT = 240;
	gui.parent = el( "div", {
		position: "fixed",
		left: "0",
		bottom: "0",
		width: "100%",
		height: GUI_HEIGHT + "px",

		background: "#222",
		color: "#ddd",

		userSelect: "none",

		fontFamily: "Helvetica Neue, sans-serif"
	}, document.body );

	// ------

	let HEADER_HEIGHT = 30;
	gui.header = el( "div", {
		position: "absolute",
		left: "0",
		top: "0",
		width: "100%",
		height: HEADER_HEIGHT + "px",

		background: "#444"
	}, gui.parent );

	let addHeaderButton = ( image, inspector, func ) => {
		let e = el( "img", {
			width: "24px",
			height: "24px",
			margin: "3px",

			cursor: "pointer"
		}, gui.header );

		e.src = image;
		gui.inspector.add( e, inspector, 0.5 );
		e.addEventListener( "click", ( _event ) => {
			if ( _event.which === 1 ) {
				func();
			}
		} );
	};

	addHeaderButton( images.config, "Config", () => {
		gui.config();
	} );

	addHeaderButton( images.save, "Save", () => {
		gui.save();
	} );

	// ------

	let PARAMLIST_WIDTH = 120;
	gui.paramList = el( "div", {
		position: "absolute",
		left: "0",
		top: HEADER_HEIGHT + "px",
		width: PARAMLIST_WIDTH + "px",
		height: "calc( 100% - " + HEADER_HEIGHT + "px )",

		background: "#111",

		overflow: "hidden"
	}, gui.parent );
	gui.paramListChildren = [];
	gui.currentParamIndex = -1;
	gui.currentParamName = "";
	gui.currentParam = null;

	gui.paramListInside = el( "div", {
		position: "absolute",
		top: "0px",
		width: "100%"
	}, gui.paramList );
	let paramListInsidePos = 0;
	gui.paramListInside.addEventListener( "wheel", ( _event ) => {
		paramListInsidePos = Math.max(
			Math.min(
				paramListInsidePos + _event.deltaY,
				gui.paramListInside.clientHeight - ( GUI_HEIGHT - HEADER_HEIGHT )
			),
			0
		);
		el( gui.paramListInside, { top: -paramListInsidePos + "px" } );
	} );

	let MODMENU_WIDTH = 200;
	gui.modMenu = el( "div", {
		position: "absolute",
		right: "0",
		top: HEADER_HEIGHT + "px",
		width: MODMENU_WIDTH + "px",
		height: "100%",

		background: "#333",

		overflow: "hidden"
	}, gui.parent );

	gui.modMenuInside = el( "div", {
		position: "absolute",
		top: "0px",
		width: "calc( 100% - 20px )",
		padding: "20px 10px"
	}, gui.modMenu );
	let modMenuInsidePos = 0;
	gui.modMenuInside.addEventListener( "wheel", ( _event ) => {
		modMenuInsidePos = Math.max(
			Math.min(
				modMenuInsidePos + _event.deltaY,
				gui.modMenuInside.clientHeight - ( GUI_HEIGHT - HEADER_HEIGHT )
			),
			0
		);
		el( gui.modMenuInside, { top: -modMenuInsidePos + "px" } );
	} );


	gui.timeline = el( "div", {
		position: "absolute",
		left: PARAMLIST_WIDTH + "px",
		top: HEADER_HEIGHT + "px",
		width: "calc( 100% - " + ( PARAMLIST_WIDTH + MODMENU_WIDTH ) + "px )",
		height: "calc( 100% - " + HEADER_HEIGHT + "px )",

		background: "#222",

		overflow: "hidden"
	}, gui.parent );

	gui.timelineCanvas = el( "canvas", {
		position: "absolute",
		width: "100%",
		height: "100%"
	}, gui.timeline );
	gui.timelineContext = gui.timelineCanvas.getContext( "2d" );

	// ------
	
	gui.dialogContainer = el( "div", {
		position: "absolute",
		display: "none",
		width: "100%",
		height: "100%"
	}, gui.parent );

	gui.dialogBackground = el( "div", {
		position: "absolute",
		width: "100%",
		height: "100%",
		
		background: "#000",
		opacity: 0.5
	}, gui.dialogContainer );

	gui.dialog = el( "div", {
		position: "absolute",

		background: "#333"
	}, gui.dialogContainer );

	gui.dialogContent = el( "div", {
		position: "absolute",
		top: "16px",
		width: "100%",
		height: "24px",

		textAlign: "center",
		whiteSpace: "pre-wrap"
	}, gui.dialog );

	gui.dialogButtonContainer = el( "div", {
		position: "absolute",
		bottom: "16px",
		width: "100%",
		height: "24px",

		textAlign: "center"
	}, gui.dialog );

	gui.addDialogButton = ( _text, _func ) => {
		let e = el( "div", {
			display: "inline-block",
			width: "60px",
			height: "16px",
			padding: "4px",
			margin: "0 5px",

			textAlign: "center",
			background: "#555",

			cursor: "pointer"
		}, gui.dialogButtonContainer );
		e.innerText = _text;

		e.addEventListener( "click", ( _event ) => {
			if ( _event.which === 1 ) {
				_func();
			}
		} );
	};

	gui.showDialog = ( w, h ) => {
		el( gui.dialogContainer, { display: "block" } );
		el( gui.dialog, {
			left: "calc( 50% - " + w / 2 + "px )",
			top: "calc( 50% - " + h / 2 + "px )",
			height: "",
			width: w + "px",
			height: h + "px"
		} );
	};

	gui.hideDialog = () => {
		el( gui.dialogContainer, { display: "none" } );

		while ( gui.dialogContent.firstChild ) {
			gui.dialogContent.removeChild( gui.dialogContent.firstChild );
		}

		while ( gui.dialogButtonContainer.firstChild ) {
			gui.dialogButtonContainer.removeChild( gui.dialogButtonContainer.firstChild );
		}
	};
	window.addEventListener( "keydown", ( _event ) => {
		if ( _event. which === 27 ) {
			gui.hideDialog();
		}
	} );

	// ------

	gui.configLength = ( _len ) => {
		gui.automaton.length = _len;

		for ( let paramName in gui.automaton.params ) {
			let param = gui.automaton.params[ paramName ];

			for ( let iNode = param.nodes.length - 1; 0 < iNode; iNode -- ) {
				let node = param.nodes[ iNode ];
				if ( _len < node.time ) {
					param.nodes.splice( iNode, 1 );
				}
			}

			let lastNode = param.nodes[ param.nodes.length - 1 ];
			if ( lastNode.time !== _len ) {
				param.addNode( _len, 0.0 );
			}
		}
	};

	gui.configConfirm = ( _len ) => {
		let divMessage = el( "div", {}, gui.dialogContent );
		divMessage.innerText = "Shortening length may cause loss of node data.\nContinue?";

		gui.addDialogButton( "Shorten", () => {
			gui.configLength( _len );
			gui.hideDialog();
		} );
		gui.addDialogButton( "Cancel", () => {
			gui.hideDialog();
		} );
		gui.showDialog( 400, 100 );
	};

	gui.config = () => {
		let inp = ( _name, _value ) => {
			let parent = el( "div", {
				position: "relative",
				width: "200px",
				height: "20px",
				margin: "0 20px 10px 20px"
			}, gui.dialogContent );

			let label = el( "div", {
				position: "absolute",
				left: "0"
			}, parent );
			label.innerText = _name;

			let input = el( "input", {
				position: "absolute",
				right: "0",
				padding: "4px",
				width: "60px",
				border: "none",

				background: "#666",
				color: "#fff"
			}, parent );
			input.value = _value;
			input.addEventListener( "keydown", ( event ) => {
				if ( event.which === 13 ) {
					event.preventDefault();
					okFunc();
				}
			} );

			return {
				parent: parent,
				label: label,
				input: input
			};
		};

		let okFunc = () => {
			gui.hideDialog();

			let l = parseFloat( inpLen.input.value );
			if ( !isNaN( l ) ) {
				if ( l < gui.automaton.length ) {
					gui.configConfirm( l );
				} else {
					gui.configLength( l );
				}
			}

			let r = parseInt( inpReso.input.value );
			if ( !isNaN( r ) ) {
				gui.automaton.resolution = r;
			}

			gui.automaton.renderAll();
		};

		let inpLen = inp( "Length", gui.automaton.length );
		let inpReso = inp( "Resolution", gui.automaton.resolution );

		gui.addDialogButton( "OK", okFunc );
		gui.addDialogButton( "Cancel", () => {
			gui.hideDialog();
		} );
		gui.showDialog( 240, 120 );
	};

	// ------

	gui.save = () => {
		let obj = {
			length: gui.automaton.length,
			resolution: gui.automaton.resolution,
		};

		obj.params = {};
		for ( let name in gui.automaton.params ) {
			let param = gui.automaton.params[ name ];
			obj.params[ name ] = param.nodes;
		}

		// ------

		let divMessage = el( "div", {}, gui.dialogContent );
		divMessage.innerText = "Copy the JSON below";

		let inputJSON = el( "input", {
			margin: "10px",
			padding: "4px",
			width: "100px",
			border: "none",

			background: "#666",
			color: "#fff"
		}, gui.dialogContent );
		inputJSON.value = JSON.stringify( obj );
		inputJSON.readOnly = true;

		gui.addDialogButton( "OK", () => {
			gui.hideDialog();
		} );
		gui.showDialog( 200, 120 );

		inputJSON.select();
	};

	// ------

	gui.addParam = ( _name, _index ) => {
		let e = el( "div", {
			margin: "2px",
			padding: "2px 8px",
			width: "calc( 100% - 4px - 16px )",
			height: "20px",

			fontSize: "14px",

			background: "#333",

			cursor: "pointer"
		}, gui.paramListInside );
		e.innerText = _name;
		e.addEventListener( "mousedown", ( _event ) => {
			if ( _event.which === 1 ) {
				gui.selectParam( _index );
				gui.updateTimeline( true );
			} else {
				// TODO: context menu
				// e.g. copy, paste...
			}
		} );

		let param = gui.automaton.params[ _name ];
		gui.inspector.add( e, () => param.getValue().toFixed( 3 ), 0.5 );

		gui.paramListChildren.push( e );
	};

	gui.clearParamList = () => {
		while ( gui.paramListInside.firstChild ) {
			gui.paramListInside.removeChild( gui.paramListInside.firstChild );
		}
		gui.paramListChildren = [];
	};

	gui.updateParamList = () => {
		gui.clearParamList();

		let paramList = gui.automaton.getParamNames();

		paramList.map( ( _name, _index ) => {
			gui.addParam( _name, _index );
		} );

		gui.selectParam( gui.currentParamIndex );
	};

	gui.timelineMin = 0.0;
	gui.timelineMax = 0.0;
	gui.canvasWidth = 0.0;
	gui.canvasHeight = 0.0;

	gui.mapTime = _time => gui.canvasWidth * _time / gui.automaton.length;
	gui.mapValue = _value => gui.canvasHeight * ( 0.1 + 0.8 * ( ( gui.timelineMax - _value ) / ( gui.timelineMax - gui.timelineMin ) ) );
	gui.rmapTime = _x => _x / gui.canvasWidth * gui.automaton.length;
	gui.rmapValue = _y => ( 0.1 - _y / gui.canvasHeight ) / 0.8 * ( gui.timelineMax - gui.timelineMin ) + gui.timelineMax;

	gui.timelineNodeRadius = 5.0;

	gui.selectedTimelineNode = -1;
	gui.selectTimelineNode = ( _index ) => {
		gui.selectedTimelineNode = _index;

		gui.resetModMenu();
	};

	gui.grabbingTimelineNode = -1;
	gui.grabTimelineNode = ( _index ) => {
		gui.grabbingTimelineNode = _index;
		gui.selectTimelineNode( _index );
	};

	let lastClick = 0;
	gui.timelineCanvas.addEventListener( "mousedown", ( _event ) => {
		let param = gui.currentParam;
		if ( !param ) { return; }

		let rect = gui.timeline.getBoundingClientRect();
		
		let now = +new Date();
		if ( now - lastClick < 500 ) {
			let removed = false;
			param.nodes.map( ( node, index ) => {
				let x = gui.mapTime( node.time );
				let y = gui.mapValue( node.value );
				if ( dist( x, y, _event.clientX - rect.left, _event.clientY - rect.top ) < gui.timelineNodeRadius ) {
					param.removeNode( index );
					gui.selectTimelineNode( -1 );
					removed = true;
				}
			} );
			if ( removed ) { return; }

			let node = param.addNode(
				gui.rmapTime( _event.clientX - rect.left ),
				gui.rmapValue( _event.clientY - rect.top )
			);
			gui.grabTimelineNode( param.nodes.indexOf( node ) );
		} else {
			param.nodes.map( ( node, index ) => {
				let x = gui.mapTime( node.time );
				let y = gui.mapValue( node.value );
				if ( dist( x, y, _event.clientX - rect.left, _event.clientY - rect.top ) < gui.timelineNodeRadius ) {
					gui.grabTimelineNode( index );
				}
			} );
		}
		lastClick = now;
	} );

	window.addEventListener( "mousemove", ( _event ) => {
	 	if ( gui.grabbingTimelineNode !== -1 ) {
			let param = gui.currentParam;
			let node = param.nodes[ gui.grabbingTimelineNode ];

			let rect = gui.timeline.getBoundingClientRect();
			param.setTime( gui.grabbingTimelineNode, gui.rmapTime( _event.clientX - rect.left ) );
			param.setValue( gui.grabbingTimelineNode, gui.rmapValue( _event.clientY - rect.top ) );

			gui.updateModMenu();
		}
	} );

	window.addEventListener( "mouseup", ( _event ) => {
	 	if ( gui.grabbingTimelineNode !== -1 ) {
			gui.grabbingTimelineNode = -1;
		}
	} );

	gui.updateTimelineRange = () => {
		let param = gui.currentParam;
		if ( !param ) { return; }

		gui.timelineMin = 0.0;
		gui.timelineMax = 0.0;
		param.nodes.map( node => {
			gui.timelineMin = Math.min( gui.timelineMin, node.value );
			gui.timelineMax = Math.max( gui.timelineMax, node.value );
		} );

		if ( gui.timelineMin === gui.timelineMax ) {
			gui.timelineMin -= 0.5;
			gui.timelineMax += 0.5;
		}
	};

	gui.updateTimelineCanvas = ( param ) => {
		gui.timelineContext.clearRect( 0, 0, gui.canvasWidth, gui.canvasHeight );

		// -----

		gui.timelineContext.beginPath();
		gui.timelineContext.moveTo( 0, gui.mapValue( param.getValue( 0.0 ) ) );

		for ( let i = 1; i < gui.timelineCanvas.width; i ++ ) {
			let t = ( i / gui.timelineCanvas.width ) * gui.automaton.length;
			let y = gui.mapValue( param.getValue( t ) );
			gui.timelineContext.lineTo( i, y );
		}

		gui.timelineContext.strokeStyle = colors.accent;
		gui.timelineContext.lineWidth = 2;
		gui.timelineContext.lineCap = "round";
		gui.timelineContext.lineJoin = "round";
		gui.timelineContext.stroke();

		// ------

		let barX = gui.mapTime( gui.automaton.time );
		let barY = gui.mapValue( gui.currentParam.getValue( gui.automaton.time ) );

		gui.timelineContext.fillStyle = colors.bar;
		gui.timelineContext.fillRect( barX - 1, 0, 2, gui.canvasHeight );

		gui.timelineContext.beginPath();
		gui.timelineContext.arc( barX, barY, 4.0, 0.0, Math.PI * 2.0, false );
		gui.timelineContext.fill();

		// ------

		param.nodes.map( ( node, index ) => {
			let x = gui.mapTime( node.time );
			let y = gui.mapValue( node.value );

			if ( gui.selectedTimelineNode === index ) {
				gui.timelineContext.beginPath();
				gui.timelineContext.arc( x, y, gui.timelineNodeRadius, 0, Math.PI * 2.0, false );
				gui.timelineContext.fillStyle = colors.accent;
				gui.timelineContext.strokeStyle = "#222";
				gui.timelineContext.lineWidth = 4;
				gui.timelineContext.stroke();
				gui.timelineContext.fill();
			} else {
				gui.timelineContext.beginPath();
				gui.timelineContext.arc( x, y, gui.timelineNodeRadius - 1, 0, Math.PI * 2.0, false );
				gui.timelineContext.fillStyle = "#222";
				gui.timelineContext.strokeStyle = colors.accent;
				gui.timelineContext.lineWidth = 4;
				gui.timelineContext.stroke();
				gui.timelineContext.fill();
			}
		} );
	};

	gui.updateTimeline = () => {
		gui.canvasWidth = window.innerWidth - PARAMLIST_WIDTH - MODMENU_WIDTH;
		gui.canvasHeight = GUI_HEIGHT - HEADER_HEIGHT;
		gui.timelineCanvas.width = gui.canvasWidth;
		gui.timelineCanvas.height = gui.canvasHeight;

		let param = gui.currentParam;
		if ( !param ) {
			return;
		}

		gui.updateTimelineCanvas( param );
	};

	gui.paramBoxListeners = [];
	gui.resetModMenu = () => {
		let param = gui.currentParam;
		if ( !param ) {
			return;
		}

		while ( gui.modMenuInside.firstChild ) {
			gui.modMenuInside.removeChild( gui.modMenuInside.firstChild );
		}
		gui.paramBoxListeners = [];

		let node = param.nodes[ gui.selectedTimelineNode ];
		if ( !node ) {
			return;
		}

		// ------

		let sep = () => {
			el( "div", {
				width: "170px",
				height: "1px",
				margin: "0 5px 5px 5px",

				background: "#666"
			}, gui.modMenuInside );
		};

		// ------

		let genParamBox = ( _name, _funcGet, _funcSet, _parent ) => {
			let func = ( _value ) => {
				let v = parseFloat( _value );
				v = isNaN( v ) ? 0.0 : v;
				valueText.innerText = v.toFixed( 3 );
				valueBox.value = v;
				if ( typeof _funcSet === "function" ) {
					_funcSet( v );
					v = _funcGet();
					valueText.innerText = v.toFixed( 3 );
					valueBox.value = v;
				}
			}

			let parent = el( "div", {
				position: "relative",
				margin: "0 0 5px 0",
				width: "100%",
				height: "14px",

				fontSize: "12px"
			}, _parent );

			let name = el( "div", {
				position: "absolute",
				left: "20px",
				top: "0",
				width: "50px",
				height: "100%"
			}, parent );
			name.innerText = _name;

			let value = el( "div", {
				position: "absolute",
				right: "10px",
				top: "0",
				width: "60px",
				height: "100%"
			}, parent );

			let valueText = el( "div", {
				position: "absolute",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",

				textAlign: "center",

				cursor: "pointer"
			}, value );
			let lastClick = 0;
			valueText.addEventListener( "mousedown", ( event ) => {
				let now = +new Date();
				if ( now - lastClick < 500 ) {
					el( valueBox, { display: "block" } );
					setTimeout( () => valueBox.focus(), 10 );
				} else {
					let lastY = event.clientY;

					let moveFunc = ( event ) => {
						let v = parseFloat( valueText.innerText );
						let y = event.clientY;
						let d = lastY - y;
						lastY = y;

						if ( event.shiftKey ) {
							let c = Math.abs( d );
							let ds = Math.sign( d );
							for ( let i = 0; i < c; i ++ ) {
								let va = Math.abs( v );
								let vs = Math.sign( v + 1E-4 * ds );
								let l = Math.floor( Math.log10( va + 1E-4 * ds * vs ) ) - 1 - ( event.altKey ? 1 : 0 );
								let r = Math.max( 0.001, Math.pow( 10.0, l ) ) * ds;
								v = parseFloat( ( v + r ).toFixed( 3 ) );
							}
							func( v );
						} else {
							let r = event.altKey ? 0.001 : 0.01;
							func( ( v + d * r ).toFixed( 3 ) );
						}
					};

					let upFunc = ( event ) => {
						window.removeEventListener( "mousemove", moveFunc );
						window.removeEventListener( "mouseup", upFunc );	
					};

					window.addEventListener( "mousemove", moveFunc );
					window.addEventListener( "mouseup", upFunc );
				}
				lastClick = now;
			} );

			let valueBox = el( "input", {
				position: "absolute",
				display: "none",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",

				border: "none",
				padding: "0",

				background: "#666",
				color: "#fff",
				textAlign: "center"
			}, value );
			valueBox.addEventListener( "keydown", ( event ) => {
			 	if ( event.which === 13 ) {
					 event.preventDefault();
					 func( valueBox.value );
					 el( valueBox, { display: "none" } );
				 }
			} );
			valueBox.addEventListener( "blur", () => {
				func( valueBox.value );
				el( valueBox, { display: "none" } );
			} );

			func( _funcGet() );
			gui.paramBoxListeners.push( () => {
				let v = _funcGet();
				valueText.innerText = v.toFixed( 3 );
				valueBox.value = v;
			} );

			return param;
		};

		// ------

		genParamBox( "time", () => { return node.time }, ( value ) => {
			return param.setTime( gui.selectedTimelineNode, value );
		}, gui.modMenuInside );

		genParamBox( "value", () => { return node.value }, ( value ) => {
			return param.setValue( gui.selectedTimelineNode, value );
		}, gui.modMenuInside );

		sep();

		// ------

		let modesContainer = el( "div", {
			margin: "5px 5px 0 5px",
			width: "180px"
		}, gui.modMenuInside );

		let selectedMode = node.mode;
		let modeEls = [];
		for ( let i = 0; i < Interpolator.MODES; i ++ ) {
			let e = el( "img", {
				width: "30px",
				height: "30px",

				margin: "2px",

				cursor: "pointer",

				filter: i === selectedMode ? "" : "grayscale( 90% )"
			}, modesContainer );
			modeEls.push( e );
			e.src = images.modes[ i ];
			e.addEventListener( "mousedown", ( _event ) => {
				param.setMode( gui.selectedTimelineNode, i );
				gui.resetModMenu();
			} );
			gui.inspector.add( e, Interpolator.modeNames[ i ], 0.5 );
		}

		for ( let p in node.params ) {
			genParamBox( p, () => { return node.params[ p ] }, ( value ) => {
				let obj = {};
				obj[ p ] = value;
				param.setParams( gui.selectedTimelineNode, obj );
			}, gui.modMenuInside );
		}

		sep();

		for ( let m = 0; m < Interpolator.MODS; m ++ ) {
			let parent = el( "div", {
				position: "relative",
				margin: "10px 0 20px 0",
				width: "100%",
				minHeight: "24px"
			}, gui.modMenuInside );

			let icon = el( "img", {
				position: "absolute",
				width: "24px",
				height: "24px",

				left: "10px",

				cursor: "pointer",

				filter: node.mods[ m ] ? "" : "grayscale( 90% )"
			}, parent );
			icon.src = images.mods[ m ];
			icon.addEventListener( "mousedown", ( _event ) => {
				param.activeModParams( gui.selectedTimelineNode, m, !node.mods[ m ] );
				gui.resetModMenu();
			} );
			gui.inspector.add( icon, Interpolator.modNames[ m ], 0.5 );

			if ( node.mods[ m ] ) {
				let params = el( "div", {
					position: "relative",
					left: "30px",
					width: "calc( 100% - 30px )"
				}, parent );

				for ( let p in node.mods[ m ] ) {
					genParamBox( p, () => { return node.mods[ m ][ p ] }, ( value ) => {
						let obj = {};
						obj[ p ] = value;
						param.setModParams( gui.selectedTimelineNode, m, obj );
					}, params );
				}
			}
		}
	};

	gui.updateModMenu = () => {
		gui.paramBoxListeners.map( ( func ) => {
			func();
		} );
	};

	gui.selectParam = ( _index ) => {
		if ( _index < 0 || gui.paramListChildren.length <= _index ) {
			return;
		}

		if ( gui.currentParam ) {
			el( gui.paramListChildren[ gui.currentParamIndex ], {
				background: "#333"
			} );
		}

		gui.currentParamIndex = _index;
		gui.currentParamName = gui.paramListChildren[ gui.currentParamIndex ].innerText;
		gui.currentParam = gui.automaton.params[ gui.currentParamName ];

		el( gui.paramListChildren[ gui.currentParamIndex ], {
			background: "#555"
		} );

		gui.updateTimelineRange();

		gui.selectTimelineNode( -1 );
	}

	// ------

	el( gui.inspector.el, {}, document.body );

	// ------

	gui.update = () => {
		gui.updateTimeline();

		if ( gui.paramListChildren.length !== gui.automaton.countParams() ) {
			gui.updateParamList();
		}
	};

	gui.resize = () => {
		gui.updateTimeline();
	};
	window.addEventListener( "resize", gui.resize );

	// ------

	gui.updateParamList();
	gui.selectParam( 0 );
	gui.updateTimelineRange();
	gui.updateTimeline();

	return gui;
};

export default AutomatonGUI;