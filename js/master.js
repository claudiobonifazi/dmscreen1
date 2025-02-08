master = {
	
	area: document.getElementById("root"),

	actions: [
		{
			id: "NPC",
			title: "characters",
			startMethod: "openNPClist"
		},
		{
			id: "TIMER",
			title: "60s timer",
			startMethod: "start60Timer",
			destroyMethod: "destroy60Timer",
			infoReceivedMethod: "info60Timer"
		},
		{
			id: "AUDIO",
			title: "noises",
			startMethod: "openNoiseList",
			data: {
				volume: 0.5
			}
		},
		{
			id: "DOCS",
			title: "documents",
			startMethod: "openDocsList"
		}
	],

	globalOptions: null,
	sessionOptions: {
		curBtnArea: null
	},

	translations: {
		it: {
			"characters": "personaggi",
			"60s timer": "timer 60s",
			"stop timer": "stop timer",
			"Remove NPC": "Rimuovi PNG",
			"Stop noises": "Ferma suoni"
		}
	},

	npcs: null,
	noises: null,
	documents: null,
	
	t: function( /*string*/engTxt ){ /* return string */
		try{
			return typeof this.translations[this.globalOptions.lang][engTxt] === "string"  ? this.translations[this.globalOptions.lang][engTxt] : engTxt;
		}catch(err){
			console.warn(err);
			return engTxt;
		}
	},

	openNPClist: function( /*object*/action ){ /* return Promise */
		return new Promise(signalEnd=>{
			this.addWindow("Characters").then(area=>{
				this._updateDOM(()=>{
					let npcs = [...this.npcs].sort((a,b)=>(a.name+' '+a.surname).localeCompare(b.name+' '+b.surname));
					area.innerHTML = `
						<div class="master_npcBtn button" data-id="-1">
							<div class="buttonName">`+this.t(`Remove NPC`)+`</div>
							<div class="buttonDesc"></div>						
						</div>`
						+npcs.reduce((cur,npc,i)=>{
							return cur+`
								<div class="master_npcBtn button" style="--index:`+(i+1)+`;" data-id="`+npc.id+`">
									<div class="buttonName">`+(npc.name+` `+(npc.surname||``)).trim()+`</div>
									<div class="buttonDesc">`+(npc.nickname||``)+`</div>
								</div>`;
						},``);
					area.querySelectorAll(".master_npcBtn").forEach(npcBtn=>{
						npcBtn.addEventListener("click",e=>{
							if( e.currentTarget.dataset.id > 0 ){
								let npc = this.npcs.find( npc => npc.id == e.currentTarget.dataset.id );
								this._sendToOtherWindow( "player", action, npc );
							}else{
								this._sendToOtherWindow( "player", { id: "hideNPC" });
							}
							this.closeWindow( area.closest('[data-guid]').dataset.guid );
						});
					});
					signalEnd();
				});
			});
		});
	},

	openNoiseList: function( /*object*/action ){ /* return Promise */
		return new Promise(signalEnd=>{
			this.addWindow("Noises").then(area=>{
				this._updateDOM(()=>{
					let noises = [...this.noises].sort((a,b)=>(a.name).localeCompare(b.name));
					area.innerHTML = `
						<div class="master_noiseBtn button" data-id="-1">
							<div class="buttonName">`+this.t(`Stop noises`)+`</div>				
						</div>`
						+noises.reduce((cur,noise,i)=>{
							return cur+`
								<div class="master_noiseBtn button" style="--index:`+(i+1)+`;" data-id="`+noise.id+`">
									<div class="buttonName">`+noise.name+`</div>
								</div>`;
						},``);
					area.querySelectorAll(".master_noiseBtn").forEach(noiseBtn=>{
						noiseBtn.addEventListener("click",e=>{
							if( e.currentTarget.dataset.id > 0 ){
								let noise = this.noises.find( noise => noise.id == e.currentTarget.dataset.id );
								this.startNoise( noise, action );
							}else{
								this.stopNoise();
							}
							this.closeWindow( area.closest('[data-guid]').dataset.guid );
						});
					});
					signalEnd();
				});
			});
		});
	},

	openDocsList: function( /*object*/action ){ /* return Promise */
		return new Promise(signalEnd=>{
			this.addWindow("Documents").then(area=>{
				this._updateDOM(()=>{
					let documents = [...this.documents].sort((a,b)=>(a.name).localeCompare(b.name));
					area.innerHTML = `
						<div class="master_docBtn button" data-id="-1">
							<div class="buttonName">`+this.t(`Hide document`)+`</div>
						</div>`
						+documents.reduce((cur,doc,i)=>{
							return cur+`
								<div class="master_docBtn button" style="--index:`+(i+1)+`;" data-id="`+doc.id+`">
									<div class="buttonName">`+doc.name+`</div>
									<div class="buttonDesc">`+doc.description+`</div>
								</div>`;
						},``);
					area.querySelectorAll(".master_docBtn").forEach(docBtn=>{
						docBtn.addEventListener("click",e=>{
							if( e.currentTarget.dataset.id > 0 ){
								let doc = this.documents.find( doc => doc.id == e.currentTarget.dataset.id );
								this._sendToOtherWindow( "player", action, doc );
							}else{
								this._sendToOtherWindow( "player", { id: "hideDoc" });
							}
							this.closeWindow( area.closest('[data-guid]').dataset.guid );
						});
					});
					signalEnd();
				});
			});
		});
	},

	volumeNoises: function( /*float*/volume ){ /* return Promise */
		let action = this.actions.find(a=>a.id==="AUDIO");
		action.data.volume = volume;
		let tastone = document.getElementById("audio_footerBtn");
		if( tastone ){
			this._updateDOM(()=>{
				tastone.style.setProperty( "--volume", parseInt(volume*100) );
			});
		}
		// return this._sendToOtherWindow( "player", action );
		return this._sendToOtherWindow( "player", {id:"VOLUMEAUDIO"}, { volume: volume });
	},

	startNoise: function( /*object*/noise, /*object*/action ){ /* return Promise */
		return new Promise(signalEnd=>{
			this._sendToOtherWindow( "player", action, noise );
			let btn = document.getElementById("audio_footerBtn");
			if( btn ){
				btn.parentElement.removeChild(btn);
			}
			btn = document.createElement("div");
			btn.classList.add("button");
			btn.classList.add("footer_btn");
			btn.id = "audio_footerBtn";
			btn.style.setProperty( "--volume", 50 );
			btn.innerHTML = `<div>noises</div><div class="simboloAudio"></div>`;
			btn.addEventListener( "click", e=>{
				this.noisesControllerClick(e);
			});
			this._updateDOM(()=>{
				document.getElementById("footer").appendChild( btn );
				signalEnd();
			});
		});
	},

	stopNoise: function(){ /* return Promise */
		return new Promise(signalEnd=>{
			this._sendToOtherWindow( "player", { id: "STOPAUDIO" });
			let tasto = document.getElementById("audio_footerBtn");
			if( tasto ){
				this._updateDOM(()=>{
					tasto.parentElement.removeChild(tasto);
					signalEnd();
				});
			}
		});
	},

	noisesControllerClick: function( /*event*/e ){ /* return Promise */
		return new Promise(signalEnd=>{
			let action = this.actions.find(a=>a.id==="AUDIO");
			let el = document.getElementById("audio_controller");
			if( el ){
				el.parentElement.removeChild(el);
			}
			el = document.createElement("div");
			el.id = "audio_controller";
			el.innerHTML = `
				<div class="button" id="audio_controllerStop">&times;</div>
				<input type="range" min="0" max="1" step="0.01" value="`+action.data.volume+`" id="audio_controllerVolume">`;
			this._updateDOM(()=>{
				document.body.appendChild(el);
				document.getElementById("audio_controllerStop").addEventListener( "click", e=>{
					this.stopNoise()
						.then(()=>{
							this._updateDOM(()=>{
								el.parentElement.removeChild(el);
							});
						});
				});
				document.getElementById("audio_controllerVolume").addEventListener( "input", e=>{
					this.volumeNoises( e.currentTarget.value );
				});
				signalEnd();
			});
		});
	},

	start60Timer: function( /*object*/action ){ /* return Promise */
		return this._sendToOtherWindow( "player", action );
	},

	info60Timer: function( /*object*/action, /*(object)*/data ){
		return new Promise(signalEnd=>{
			if( typeof data.data.val !== "undefined" ){
				this._updateDOM(()=>{
					let btn = document.querySelector('button[data-id="60T"]');
					if( btn ){
						btn.innerText = data.data.val ? this.t("stop timer")+" ("+data.data.val+")" : action.title;
					}
					signalEnd();
				});
			}else{
				signalEnd();
			}
		});
	},

	addWindow: function( /*(string)*/title ){ /* return Promise */
		return new Promise(signalEnd=>{
			let newEl = document.createElement("div");
			newEl.classList.add("master_dialog");
			newEl.dataset.guid = Math.random();
			
			newEl.innerHTML = `
				<div class="master_dialogHeader">
					<div class="master_dialogTitle">`+(title||"")+`</div>
					<div class="crossButton master_dialogClose">&times;</div>
				</div>
				<div class="master_dialogBody"></div>`;
			this._updateDOM(()=>{
				document.getElementById("root").appendChild(newEl);
				newEl.querySelector(".master_dialogClose").addEventListener("click",e=>{
					document.getElementById("root").removeChild(newEl.closest(".master_dialog"));
				});
				signalEnd( newEl.querySelector(".master_dialogBody") );
			});
		});
	},

	closeWindow: function( /*string*/id ){ /* return Promise */
		return new Promise(signalEnd=>{
			let el = document.body.querySelector('.master_dialog[data-guid="'+id+'"]');
			if( el ){
				el.parentElement.removeChild(el);
			}else{
				console.warn("Finestra "+id+" non esiste");
			}
		});
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
	
	_loadDocuments: function(){ /* return Promise */
		return new Promise((signalEnd,signalError)=>{
			let docsUrl = "resources/"+this.globalOptions.campaign+"/documents_"+(this.globalOptions.lang||"it")+".json";
			fetch(docsUrl)
				.then(docs=>docs.json())
				.then(docs=>{this.documents=docs})
				.then(signalEnd)
				.catch(signalError)
		});
	},

	_sendToOtherWindow: function( /*string*/to, /*object*/action, /*(object)*/data ){ /* return Promise */
		let packet = {
			from: "master",
			to: to,
			action: action.id,
			data: data || {}
		};
        this.socket.emit( "from_master_to_players", packet );
	},

	// show list in DOM
	// set this.options.curBtnArea
	showButtons: function(){ /* return Promise */
		return new Promise(signalEnd=>{
			this.sessionOptions.curBtnArea = null;
			let btnList = document.createElement("div");
			btnList.id = "mainButtonList";
			btnList.innerHTML = this.actions.reduce((cur,btn,i)=>{
				return cur+`<button class="button" data-id="`+btn.id+`" tabindex="0" style="--index:`+(i+1)+`;">`+this.t(btn.title)+`</button>`;
			},``);
			this._updateDOM(()=>{
				this.area.appendChild(btnList);
				// click on button -> exec button startMethod
				this.sessionOptions.curBtnArea = document.getElementById("mainButtonList");
				let btns = this.sessionOptions.curBtnArea.querySelectorAll('button[data-id]');
				btns.forEach(btn=>{
					btn.addEventListener( "click", e=>{
						e.preventDefault();
						let action = this.actions.find(bd=>bd.id===btn.dataset.id);
						if( typeof this[action.startMethod] === "function" ){
							let btn = e.currentTarget;
							btn.classList.add("active");
							this[action.startMethod]( action ).then(()=>{
								if( btn ){
									btn.classList.remove("active");
								}
							});
						}else{
							console.error("No startMethod linked to button");
							if( btn ){
								btn.classList.remove("active");
							}
						}
						return false;
					});
				});
				signalEnd(btns);
			});
		});
	},

	showFooter: function(){ /* return Promise */
		return new Promise(signalEnd=>{
			let footer = document.createElement("div");
			footer.id = "footer";
			this._updateDOM(()=>{
				this.area.appendChild(footer);
				signalEnd();
			});
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

	// demon waiting for his player's commands
	_waitForCommands: function(){ /* return undefined */
        this.socket.on( 'from_player_to_master', data=>{
            let action = this.actions.find(a=>a.id===data.action);
            if( action ){
                if( typeof this[action.infoReceivedMethod] === "function" ){
                    this[action.infoReceivedMethod]( action, data );
                }else{
                    console.error("no infoReceivedMethod for "+action.id);
                }
            }else{
                console.error("no action for "+data.action);
            }
        });
	},

	_updateDOM: function _updateDOM( /*function*/callback ){ /* return undefined */
		requestAnimationFrame( callback.bind(this) );
	},

	init: function(){ /* return this */
		return Promise.resolve()
			.then(this._loadGlobalOptions.bind(this))
			.then(()=>Promise.all([
					this._loadNPCs(),
					this._loadNoises(),
					this._loadDocuments()
				])
			)
            .then(this._connectToSocket.bind(this))
			.then(this._waitForCommands.bind(this))
			.then(this.showButtons.bind(this))
			.then(this.showFooter.bind(this));
	}
};

master.init();