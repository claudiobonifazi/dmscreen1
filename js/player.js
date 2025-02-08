player = {

	area: document.getElementById("root"),

	actions: [
		{
			id: "NPC",
			title: "characters",
			startMethod: "showNpc"
		},
		{
			id: "hideNPC",
			title: "hide NPC",
			startMethod: "hideNpc"
		},
		{
			id: "TIMER",
			title: "timer",
			startMethod: "timerStart",
			destroyMethod: "timerStop",
			startAnimMethod: "timerStartAnim",
			data: {
				speed: 1,
				startingNumber: 60,
				interval: null
			}
		},
		{
			id: "AUDIO",
			title: "noises",
			startMethod: "startNoises",
			data: {
				volume: 0.5
			}
		},
		{
			id: "STOPAUDIO",
			title: "stop noises",
			startMethod: "stopNoises",
			data: {}
		},
		{
			id: "VOLUMEAUDIO",
			title: "volume noises",
			startMethod: "volumeNoises"
		},
		{
			id: "DOCS",
			title: "Documents",
			startMethod: "showDoc"
		},
		{
			id: "hideDoc",
			title: "hide Doc",
			startMethod: "hideDoc"
		},
	],

	globalOptions: null,
	sessionOptions: {
		playSounds: true 
	},

	socket: null,
	
	sounds: {
		"fire1": {
			url: "./audio/fire1.wav",
			isLoaded: false,
			volume: 1,
			obj: null
		},
		"fire2": {
			url: "./audio/fire2.wav",
			isLoaded: false,
			volume: 1,
			obj: null
		},
		"fire3": {
			url: "./audio/fire3.wav",
			isLoaded: false,
			volume: 1,
			obj: null
		},
		"sword1": {
			url: "./audio/sword1.wav",
			isLoaded: false,
			volume: 1,
			obj: null
		},
		"sonic1": {
			url: "./audio/sonic1.wav",
			isLoaded: false,
			volume: 1,
			obj: null
		}
	},

	npcs: null,

	// color = "#......"
	// factor = float >= 0, 1 = do nothing
	// return "rgb(rrr,ggg,bbb)"
	_lighterColor: function( /*string*/color, /*float*/factor ){ /* return string */
		factor = factor||1;
		let rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
		rgb = [ parseInt(rgb[1],16), parseInt(rgb[2],16), parseInt(rgb[3],16) ];
		return "rgb("+rgb.map(c=>parseInt(c)*factor).join(",")+")";
	},

	// create a new UI fullscreen page
	newPage: function( /*string*/id, /*(string)*/html ){ /* return Promise */
		return new Promise(signalEnd=>{
			let page = document.createElement("div");
			page.id = "page_"+id+"_"+Math.round(Math.random()*9999);
			page.classList.add("player_page");
			page.innerHTML = html;
			this._updateDOM(()=>{
				document.body.querySelectorAll(".player_page").forEach(prevPage=>{
					if( prevPage && prevPage.parentElement ){
						prevPage.parentElement.removeChild( prevPage );
					}
				});
				this.area.appendChild(page);
				signalEnd(page);
			});
		});
	},

	showNpc: function( /*object*/action, /*(object)*/data ){ /* return Promise */
		return new Promise(signalEnd=>{
			let html = `
				<div class="player_showNpcArea" style="`+this._npcViewCss(data.data)+`">
					<div class="player_showNpcImg"></div>
					<div class="player_showNpcDesc">
						<div class="player_showNpcName">`+(data.data.name+` `+(data.data.surname||``)).trim()+`</div>
						<div class="player_showNpcTitle">`+(data.data.nickname||``)+`</div>
					</div>
				</div>`;
			this.soundEffect("sword1");
			this.newPage( action.id, html )
				.then(()=>{
					signalEnd()
				});
		});
	},

	hideNpc: function( /*object*/action, /*(object)*/data ){ /* return Promise */
		return new Promise(signalEnd=>{
			let els = document.querySelectorAll('.player_page[id^="page_NPC_"]');
			this._updateDOM(()=>{
				els.forEach(el=>{
					el.parentElement.removeChild(el);
				});
				signalEnd();
			});
		});
	},

	_npcViewCss: function( /*object*/data ){ /* return string */
		return `--col:`+data.color+`;
				--col-l:`+this._lighterColor(data.color,1.15)+`;
				--img:url('../`+data.portrait+`');`;
	},

	showDoc: function( /*object*/action, /*(object)*/data ){ /* return Promise */
	console.log(action,data)
		return new Promise(signalEnd=>{
			let html = `
				<div class="player_showDocArea">`
					+( data.data.type === "img" ? 
						`<img class="player_showDocImg" src="`+data.data.file+`">`
					 : `` )
				+`</div>`;
			this.soundEffect("sonic1");
			this.newPage( action.id, html )
				.then(()=>{
					signalEnd()
				});
		});
	},

	hideDoc: function( /*object*/action, /*(object)*/data ){ /* return Promise */
		return new Promise(signalEnd=>{
			let els = document.querySelectorAll('.player_page[id^="page_DOCS_"]');
			this._updateDOM(()=>{
				els.forEach(el=>{
					el.parentElement.removeChild(el);
				});
				signalEnd();
			});
		});
	},

	startNoises: function( /*object*/action, /*(object)*/data ){ /* return Promise */
		return new Promise(signalEnd=>{
			console.log(data)
			let ext = data.data.file.substr( data.data.file.lastIndexOf(".")+1 );
			let startAction = this.actions.find(n=>n.id==="AUDIO");
			let stopAction = this.actions.find(n=>n.id==="STOPAUDIO");
			let prima;
			if( stopAction.data.el ){
				prima = this.stopNoises();
			}else{
				prima = Promise.resolve();
			}
			prima.then(()=>{
				let audio = document.createElement('audio');
				audio.autoplay = true;
				audio.loop = true;
				audio.volume = startAction.data.volume||0.5;
				audio.innerHTML = `<source type="audio/`+ext+`" src="`+data.data.file+`">`;
				stopAction.data.el = audio;
				this._updateDOM(()=>{
					document.body.appendChild(audio);
					audio.play();
					signalEnd();
				});
			});
		});
	},

	stopNoises: function( /*object*/action, /*(object)*/data ){ /* return Promise */
		return new Promise(signalEnd=>{
			this._updateDOM(()=>{
				let stopAction = this.actions.find(n=>n.id==="STOPAUDIO");
				if( stopAction.data.el && stopAction.data.el.parentElement ){
					stopAction.data.el.parentElement.removeChild( stopAction.data.el );
					delete stopAction.data.el;
					signalEnd();
				}
			});
		});
	},

	volumeNoises: function( /*object*/action, /*(object)*/data ){ /* return Promise */
		return new Promise(signalEnd=>{
			this._updateDOM(()=>{
				let stopAction = this.actions.find(n=>n.id==="STOPAUDIO");
				if( stopAction.data.el ){
					stopAction.data.el.volume = data.data.volume;
					signalEnd();
				}
			});
		});
	},

	// animation to show when starting up the timer
	timerStartAnim: function( page ){ /* return Promise */
		return this.soundEffect("fire1");
	},

	// starting the timer
	timerStart: function( /*object*/action, /*(object)*/data ){ /* return Promise */
		return new Promise((signalEnd,signalError)=>{
			try{
				if( action.data.interval ){
					clearInterval(action.data.interval);
				}
				let html = `
					<div id="timer">
						<div id="timer_backFlash"></div>
						<div id="timer_number"></div>
					</div>`;
				this.newPage( action.id, html ).then(page=>{
					this[action.startAnimMethod]( page );
					let mainArea = document.getElementById("timer");
					let numArea = document.getElementById("timer_number");
					mainArea.style.setProperty( "--speed", action.data.speed||1 );
					numArea.style.setProperty( "--num", action.data.startingNumber||60 );
					let num = action.data.startingNumber;
					let showNum = ()=>{
						this.sendToOtherWindow( "master", action.id, { val: num });
						this._updateDOM(()=>{
							mainArea.style.setProperty( "--num", num );
							numArea.innerText = num;
							num--;
							if( num === -1 ){
								this[action.destroyMethod]( action, page );
								signalEnd( action, page );
							}
						});
					}
					action.data.interval = setInterval( showNum, 1000/(action.data.speed||1) );
					showNum();
				});
			}catch(err){
				signalError(err);
			}
		});
	},

	// stop and reset the timer
	timerStop: function( /*object*/action, /*(domEl)*/page ){ /* return Promise */
		return new Promise(signalEnd=>{
			clearInterval( action.data.interval );
			this.sendToOtherWindow( "master", action.id, { val: "" });
			if( !page ){
				page = document.getElementById("timer").closest(".player_page");
			}
			if( page ){
				this.soundEffect("fire3");
				this._updateDOM(()=>{
					page.classList.add("endEffect");
					page.innerHTML = "";
				});
				setTimeout(()=>{
					this._updateDOM(()=>{
						if( page && page.parentElement ){
							page.parentElement.removeChild(page);
						}
						signalEnd( action );
					});
				},1000);
			}
		});
	},

	// play a sound (chosen from the .sounds list)
	soundEffect: function soundEffect( /*string*/quale ){ /* return Promise */
		return new Promise((signalEnd,signalError)=>{
			try{
				if( this.sessionOptions.playSounds ){
					if( (quale||"").length && quale in this.sounds ){
						let s = this.sounds[quale];
						if( s.obj === null ){
							s.obj = new Audio(s.url);
							// s.obj.muted = "muted";
							s.obj.volume = s.volume;
						}
						s.obj.currentTime = s.startTime || 0;
						s.obj.play().then(()=>{
							s.isLoaded = true;
							signalEnd();
						});
					}
				}
			}catch(err){
				console.error(err);
				signalEnd(); // no catch. Only then.
			}
		});
	},

	// send command to master
	sendToOtherWindow: function( /*string*/to, /*string*/actionId, /*(object)*/data ){ /* return undefined */
		let packet = {
			from: "player",
			to: to,
			action: actionId,
			data: data || {}
		};
		this.socket.emit( "from_player_to_master", packet );
	},

	_loadGlobalOptions: function(){ /* return Promise */
		return new Promise((signalEnd,signalError)=>{
			fetch("resources/globalOptions.json")
				.then(options=>options.json())
				.then(options=>{this.globalOptions=options})
				.then(signalEnd)
				.catch(signalError)
		});
	},

	_loadNPCs: function(){ /* return Promise */
		return new Promise((signalEnd,signalError)=>{
			let npcUrl = "resources/"+this.globalOptions.campaign+"/npc_"+(this.globalOptions.lang||"it")+".json";
			fetch(npcUrl)
				.then(npcs=>npcs.json())
				.then(npcs=>{this.npcs=npcs})
				.then(signalEnd)
				.catch(signalError)
		});
	},

	_loadNoises: function(){ /* return Promise */
		return new Promise((signalEnd,signalError)=>{
			let noisesUrl = "resources/"+this.globalOptions.campaign+"/noises_"+(this.globalOptions.lang||"it")+".json";
			fetch(noisesUrl)
				.then(noises=>noises.json())
				.then(noises=>{this.noises=noises})
				.then(signalEnd)
				.catch(signalError)
		});
	},

	// demon waiting for his master's commands
	_waitForCommands: function(){ /* return undefined */
		this.socket.on( 'from_master_to_players', data=>{
			let action = this.actions.find(a=>a.id===data.action);
			if( action ){
				if( typeof this[action.startMethod] === "function" ){
					this[action.startMethod]( action, data )
						.catch(alert);
				}else{
					console.error("no startMethod for "+action.id);
				}
			}else{
				console.error("no action for "+data.action);
			}
		});
	},

	_connectToSocket: function(){ /* return Promise */
		this.socket = io();
		this.socket.on( "error", error=>{
			console.error(error);
		});
		this.socket.on("connect", socket=>{
			this._updateDOM(()=>{
				document.body.classList.remove("socket-unloaded");
			});
		});
		this.socket.io.on("reconnect_attempt", attempt=>{
			console.log("reconnect")
		});
		this.socket.io.on("reconnect", socket=>{
			this._updateDOM(()=>{
				document.body.classList.remove("socket-unloaded");
			});
		});
		this.socket.on("disconnect", reason=>{
			this._updateDOM(()=>{
				document.body.classList.add("socket-unloaded");
			});
		});
		this.socket.io.on("connect_error", error=>{
			console.error(error);
			this._updateDOM(()=>{
				document.body.classList.add("socket-unloaded");
			});
		});
	},

	// any change to DOM should pass through this wrapper
	_updateDOM: function( /*function*/callback, /*(bool)*/animTransition ){ /* return undefined */
		if( animTransition && typeof document.startViewTransition === "function" ){
			document.startViewTransition( callback.bind(this) );
		}else{
			requestAnimationFrame( callback.bind(this) );
		}
	},

	// start of program
	init: function(){ /* return Promise */
		return Promise.resolve()
			.then(this._loadGlobalOptions.bind(this))
			.then(()=>Promise.all([
					this._loadNPCs(),
					this._loadNoises()
				])
			)
			.then(this._connectToSocket.bind(this))
			.then(this._waitForCommands.bind(this));
	}
};

player.init()
	  .then(()=>{ console.log("Ready") });