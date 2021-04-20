/*
*   Calculations for the FBFC - derived from C version by
*   Mike Wotton @ PNFI version 5.0001. 
*
*   By Joe Young For Alaska Fire & Fuels
*   MesoWest/SynopticLabs/Synoptic Data Corp
*   University of Utah
*   Salt Lake City, Utah, USA
*   May 2016
*/


(function (root, factory) {
	"use strict";

	/*global define*/
	if (typeof define === 'function' && define.amd) {
		define(['cffdrs'], factory);                 // AMD
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory(require('cffdrs')); // Node
	} else {
		factory(root.cffdrs);                        // Browser
	}
}(this, function (cffdrs) {
	"use strict";
	/*
	*  DEFINE THE FBPC NODES
	*/
	"use strict";
	var VERSION = 1.0;

	var _inputs, _mains, _secs, _heads, _flanks, _backs;
	var _fbpc, _fuels, _fbpc_mult;
	var _units = "metric";


	/*
	*     Define system Constants. There aren't many.
	*/
	var FBPC_CONST = {
		slopelimit_isi: 0.01,
		numfuels: 18
	};

	/*
	* FBFC Object prototype - not currently used, but, should be
	*/

	function FBFC() {
			// empty :(
	}

	function setup_const() {
		var fuel_coefficients = [];
		/*   fuel type 0 */
		fuel_coefficients.push({})
		fuel_coefficients[0].fueltype = "M1 ";
		fuel_coefficients[0].a=110.0; fuel_coefficients[0].b=0.0282; fuel_coefficients[0].c=1.5;
		fuel_coefficients[0].q=0.80; fuel_coefficients[0].bui0=50; fuel_coefficients[0].cbh=6; fuel_coefficients[0].cfl=0.80;
		/*   fuel type 1 */
		fuel_coefficients.push({});
		fuel_coefficients[1 ].fueltype = "M2 ";
		fuel_coefficients[1 ].a=110.0; fuel_coefficients[1 ].b=0.0282; fuel_coefficients[1 ].c=1.5;
		fuel_coefficients[1 ].q=0.80; fuel_coefficients[1 ].bui0=50; fuel_coefficients[1 ].cbh=6; fuel_coefficients[1 ].cfl=0.80;
		/*   fuel type 2 */
		fuel_coefficients.push({});
		fuel_coefficients[2 ].fueltype = "M3 ";
		fuel_coefficients[2 ].a=120.0; fuel_coefficients[2 ].b=0.0572; fuel_coefficients[2 ].c=1.4;
		fuel_coefficients[2 ].q=0.80; fuel_coefficients[2 ].bui0=50; fuel_coefficients[2 ].cbh=6; fuel_coefficients[2 ].cfl=0.80;
		/*   fuel type 3 */
		fuel_coefficients.push({});
		fuel_coefficients[3 ].fueltype = "M4 ";
		fuel_coefficients[3 ].a=100.0; fuel_coefficients[3 ].b=0.0404; fuel_coefficients[3 ].c=1.48;
		fuel_coefficients[3 ].q=0.80; fuel_coefficients[3 ].bui0=50; fuel_coefficients[3 ].cbh=6; fuel_coefficients[3 ].cfl=0.80;
		/*   fuel type 4 */
		fuel_coefficients.push({});
		fuel_coefficients[4 ].fueltype = "C1 ";
		fuel_coefficients[4 ].a=90.0; fuel_coefficients[4 ].b=0.0649; fuel_coefficients[4 ].c=4.5;
		fuel_coefficients[4 ].q=0.90; fuel_coefficients[4 ].bui0=72; fuel_coefficients[4 ].cbh=2; fuel_coefficients[4 ].cfl=0.75;
		/*  fuel type 5 */
		fuel_coefficients.push({});
		fuel_coefficients[5 ].fueltype = "C2 ";
		fuel_coefficients[5 ].a=110.0; fuel_coefficients[5 ].b=0.0282; fuel_coefficients[5 ].c=1.5;
		fuel_coefficients[5 ].q=0.70; fuel_coefficients[5 ].bui0=64; fuel_coefficients[5 ].cbh=3; fuel_coefficients[5 ].cfl=0.80;
		/*   fuel type 6 */
		fuel_coefficients.push({});
		fuel_coefficients[6 ].fueltype = "C3 ";
		fuel_coefficients[6 ].a=110.0; fuel_coefficients[6 ].b=0.0444; fuel_coefficients[6 ].c=3.0;
		fuel_coefficients[6 ].q=0.75; fuel_coefficients[6 ].bui0=62; fuel_coefficients[6 ].cbh=8; fuel_coefficients[6 ].cfl=1.15;
		/*   fuel type 7 */
		fuel_coefficients.push({});
		fuel_coefficients[7 ].fueltype = "C4 ";
		fuel_coefficients[7 ].a=110.0; fuel_coefficients[7 ].b=0.0293; fuel_coefficients[7 ].c=1.5;
		fuel_coefficients[7 ].q=0.80; fuel_coefficients[7 ].bui0=66; fuel_coefficients[7 ].cbh=4; fuel_coefficients[7 ].cfl=1.20;
		/*  fuel type 8 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[8 ].fueltype = "C5 ";
	 	fuel_coefficients[8 ].a=30.0; fuel_coefficients[8 ].b=0.0697; fuel_coefficients[8 ].c=4.0;
	 	fuel_coefficients[8 ].q=0.80; fuel_coefficients[8 ].bui0=56; fuel_coefficients[8 ].cbh=18; fuel_coefficients[8 ].cfl=1.20;
		/*  fuel type 9 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[9 ].fueltype = "C6 ";
	 	fuel_coefficients[9 ].a=30.0; fuel_coefficients[9 ].b=0.0800; fuel_coefficients[9 ].c=3.0;
	 	fuel_coefficients[9 ].q=0.80; fuel_coefficients[9 ].bui0=62; fuel_coefficients[9 ].cbh=7; fuel_coefficients[9 ].cfl=1.80;
		/*  fuel type 10 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[10].fueltype = "C7 ";
	 	fuel_coefficients[10].a=45.0; fuel_coefficients[10].b=0.0305; fuel_coefficients[10].c=2.0;
	 	fuel_coefficients[10].q=0.85; fuel_coefficients[10].bui0=106; fuel_coefficients[10].cbh=10; fuel_coefficients[10].cfl=0.50;
		/*  fuel type 11 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[11].fueltype = "D1 ";
	 	fuel_coefficients[11].a=30.0; fuel_coefficients[11].b=0.0232; fuel_coefficients[11].c=1.6;
	 	fuel_coefficients[11].q=0.90; fuel_coefficients[11].bui0=32; fuel_coefficients[11].cbh=0; fuel_coefficients[11].cfl=0.0;
		/*  fuel type 12 */
		fuel_coefficients.push({});
		fuel_coefficients[12].fueltype = "S1 ";
		fuel_coefficients[12].a=75.0; fuel_coefficients[12].b=0.0297; fuel_coefficients[12].c=1.3;
		fuel_coefficients[12].q=0.75; fuel_coefficients[12].bui0=38; fuel_coefficients[12].cbh=0; fuel_coefficients[12].cfl=0.0;
		/* fuel type 13 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[13].fueltype = "S2 ";
	 	fuel_coefficients[13].a=40.0; fuel_coefficients[13].b=0.0438; fuel_coefficients[13].c=1.7;
	 	fuel_coefficients[13].q=0.75; fuel_coefficients[13].bui0=63; fuel_coefficients[13].cbh=0; fuel_coefficients[13].cfl=0.0;
		/* fuel type 14 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[14].fueltype = "S3 ";
	 	fuel_coefficients[14].a=55.0; fuel_coefficients[14].b=0.0829; fuel_coefficients[14].c=3.2;
	 	fuel_coefficients[14].q=0.75; fuel_coefficients[14].bui0=31; fuel_coefficients[14].cbh=0; fuel_coefficients[14].cfl=0.0;
		/* fuel type 15 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[15].fueltype = "O1a";
	 	fuel_coefficients[15].a=190.0; fuel_coefficients[15].b=0.0310; fuel_coefficients[15].c=1.40;
	 	fuel_coefficients[15].q=1.000; fuel_coefficients[15].bui0=1; fuel_coefficients[15].cbh=0; fuel_coefficients[15].cfl=0.0;
		/* fuel type 16 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[16].fueltype = "O1b";
	 	fuel_coefficients[16].a=250.0; fuel_coefficients[16].b=0.0350; fuel_coefficients[16].c=1.7;
	 	fuel_coefficients[16].q=1.000; fuel_coefficients[16].bui0=1; fuel_coefficients[16].cbh=0; fuel_coefficients[16].cfl=0.0;
		/* fuel type 17 */
	 	fuel_coefficients.push({});
	 	fuel_coefficients[17 ].fueltype = "D2 ";
	 	fuel_coefficients[17 ].a=6.0; fuel_coefficients[17 ].b=0.0232; fuel_coefficients[17 ].c=1.6;
	 	fuel_coefficients[17 ].q=0.90; fuel_coefficients[17 ].bui0=32; fuel_coefficients[17 ].cbh=0; fuel_coefficients[17 ].cfl=0.0;

		 // and that's all the fuel types. This object needs to be extracted and used by other functions
		 //console.log(JSON.stringify(fuel_coefficients,5))
		 return fuel_coefficients;
	}

	function ffmc_effect(ffmc) {
			var ffmc = ffmc*1;
			var mc,ff;
			mc=147.2*(101.0-ffmc)/(59.5+ffmc);
			ff=91.9*Math.exp(-0.1386*mc)*(1+Math.pow(mc,5.31)/49300000.0);
			return ff;
	}

	function rate_of_spread(x1, fuels, mains) {
			// compute rmainse of spread using _inputs, main_output 'mains' and fuel coefficients fuels
			var fw,isz,mult,mu,rsi;
			var ffmc = _inputs.ffmc*1;
			var waz = _inputs.waz*1
			_inputs.ps = _inputs.ps*1
			_inputs.bui = _inputs.bui*1
			var ws = _inputs.ws*1;
			_mains.ff=ffmc_effect(ffmc);
			_mains.raz = waz;

			isz=0.208*_mains.ff;
			if (_inputs.ps>0) {
				_mains.wsv = slope_effect(_inputs,fuels,_mains,isz);
			}
			else _mains.wsv= ws;
			if (_mains.wsv<40.0) {
					fw=Math.exp(0.05039*_mains.wsv);
				}
			else fw=12.0*(1.0-Math.exp(-0.0818*(_mains.wsv-28)));
			_mains.isi= isz*fw; // will you inherit?!?!
			rsi = ros_calc(_inputs,fuels, _mains.isi, mu);
			_mains.rss = rsi*bui_effect(fuels,_mains,_inputs.bui); // this gets the correct RSS!!
			return(_mains.rss);
	}

	function ros_calc(x1, fuels, isi, mult) {
			var ros;

			if (fuels.fueltype.substr(0,2) == "O1") {  
				return grass(fuels, _inputs.cur ,isi, mult);
			} 

			if (fuels.fueltype.substr(0,2) == "M1" || fuels.fueltype.substr(0,2) == "M2") {
				return mixed_wood(fuels,isi,mult,_inputs.pc);
			} 

			if (fuels.fueltype.substr(0,2) == "M3" || fuels.fueltype.substr(0,2) == "M4") {
				return dead_fir(fuels,_inputs.pdf,isi,mult);
			}
			
			if (fuels.fueltype.substr(0,2) == "D2") {
				return D2_ROS(fuels,isi,_inputs.bui,mult);
			}
			/* if all else has fail its a conifer   */
			return conifer(fuels,isi,mult);
	}

		// FUEL TYPE RATES OF SPREAD

	function grass(fuels, cur, isi, mult) {
			var mu,ros;
			if(cur*1.0>=58.8) mu=0.176 + 0.02*( cur*1.0 - 58.8 ) ;
			else mu=0.005*(Math.exp(0.061*cur) - 1.0) ;
			ros=mu * (fuels.a*Math.pow( (1.0-Math.exp(-1.0*fuels.b*isi)) , fuels.c));
			if(mu<0.001)mu=0.001;  /* to have some value here*/
			mult=mu; // I guess I am just hoping this gets carried around..... :/
			_fbpc_mult = mu;
			return ros;
	}

	function mixed_wood(fuels,  isi, mu, pc) {
			// mixed wood rate of spread with fuel coefficient fuels, and other things
			// mu is written as a pointer, but I don't think that is what it is here :(
			var ros, mult,ros_d1,ros_c2;
			var i;
			mu=pc/100.0;
			ros_c2=fuels.a*Math.pow( (1.0-Math.exp(-1.0*fuels.b*isi)), fuels.c);
			if(fuels.fueltype.substr(0,2) == "M2") mult=0.2;
			else mult=1.0;

			// GET D1 Fuel type info - DO NOT CHANGE PTR ENTIRELY THOUGH!
			var fuels_d = _fuels[get_fueltype_index( "D1")];
			//window.fbfc_fuels = fuels; // for inheritance inspection

			ros_d1=fuels_d.a*Math.pow( (1.0-Math.exp(-1.0*fuels_d.b*isi) ),fuels_d.c);

			ros=(pc/100.0)*ros_c2 + mult* (100-pc)/100.0*ros_d1;
			//console.log("%f  %f  mu=%f \n",pc/100.0,(100-pc)/100.0, mu);
			_fbpc_mult = mu;
			return(ros);
	}

	function dead_fir(fuels, pdf, isi, mu) {
			var a,b,c;
			var i;
			var ros,rosm3or4_max,ros_d1, greenness=1.0;
			if (fuels.fueltype.substr(0,2) == "M4") greenness=0.2;

			rosm3or4_max=fuels.a*Math.pow( ( 1.0-Math.exp(-1.0*fuels.b*isi)),fuels.c);

			var fuels_d = _fuels[get_fueltype_index( "D1")];
			ros_d1=fuels_d.a*Math.pow( (1.0-Math.exp(-1.0*fuels_d.b*isi) ),fuels_d.c);

			ros=(1.0*pdf)/100.0*rosm3or4_max + (100.0-(1.0*pdf))/100.0*greenness*ros_d1;

			mu = (1.0*pdf)/100.0;
			_fbpc_mult = mu; // for inheritance checking!

			return(ros);
	}

	function D2_ROS(fuels, isi, bui, mu) {
			mu = 1.0;
			_fbpc_mult = mu; // for inheritance checking!
			if(bui>=80) return( fuels.a*Math.pow( (1.0-Math.exp(-1.0*fuels.b*isi) ),fuels.c) );
			else return (0.0);
	}

	function conifer(fuel,  isi, mu) {
			mu = 1.0;
			_fbpc_mult = mu;
			return fuel.a*Math.pow( (1.0-Math.exp(-1.0*fuel.b*isi) ),fuel.c);
	}

		// ROS MODIFIERS

	function bui_effect(fuels, at, bui) {
			// modify _mains (at) by the bui effect
			var  bui_avg=50.0;

			if(bui==0) bui=1.0;
			_mains.be=Math.exp(bui_avg*Math.log(fuels.q)*( (1.0/bui)-(1.0/fuels.bui0) ) );
			return (_mains.be);
	}

	function slope_effect(x1, fuels, at, isi) {
			var isf,rsf,wse,ps,rsz,wsx,wsy,wsex,wsey,wsvx,wsvy,
					wrad,srad,wsv,raz,check,wse2,wse1;
			var mu=0.0;
			ps=_inputs.ps*1.0; // equiv float

			if(ps>70.0) ps=70.0;   /* edited in version 4.6*/
			_mains.sf=Math.exp(3.533*Math.pow(ps/100.0,1.2));
			if(_mains.sf>10.0)_mains.sf=10.00;  /* added to ensure maximum is correct in version 4.6  */

			if (fuels.fueltype.substr(0,2) == "M1" || fuels.fueltype.substr(0,2) == "M2")
					isf=ISF_mixedwood(fuels,isi,_inputs.pc,_mains.sf);
			else if (fuels.fueltype.substr(0,2) == "M3" || fuels.fueltype.substr(0,2) == "M4")
					isf=ISF_deadfir(fuels,isi,_inputs.pdf,_mains.sf);
			else{
			 rsz=ros_calc(_inputs, fuels, isi, mu); // this is the local multiplier!
			 // mu should be 1 after all this, but it isn't because that's way too deep. shit.
			 mu = _fbpc_mult;
			 rsf=rsz*_mains.sf;

			 if(rsf>0.0)check=1.0-Math.pow((rsf/(mu*fuels.a)),(1.0/fuels.c) );
			 else check=1.0;
			 if(check<FBPC_CONST.slopelimit_isi)check=FBPC_CONST.slopelimit_isi;

			 isf=(1.0/(-1.0*fuels.b))*Math.log(check);
			}
			if(isf==0.0)isf=isi;  /* should this be 0.0001 really  */
			wse1 = Math.log(isf/(0.208*_mains.ff))/0.05039;
			if(wse1<=40.0) wse=wse1;
			else{
				if(isf>(0.999*2.496*_mains.ff) ) isf=0.999*2.496*_mains.ff;
				wse2=28.0-Math.log(1.0-isf/(2.496*_mains.ff))/0.0818;
				wse=wse2;
			}

			wrad=_inputs.waz/180.0*3.1415926;
			wsx=_inputs.ws*Math.sin(wrad);
			wsy=_inputs.ws*Math.cos(wrad);
			srad=_inputs.saz/180.0*3.1415926;
			wsex=wse*Math.sin(srad);
			wsey=wse*Math.cos(srad);
			wsvx=wsx+wsex;
			wsvy=wsy+wsey;
			wsv=Math.sqrt(wsvx*wsvx+wsvy*wsvy);
			raz=Math.acos(wsvy/wsv); 
			raz=(raz/3.1415926)*180.0;
			if(wsvx<0)raz=360-raz;
			_mains.raz=raz;
			return (1.0*wsv) ;
	}

		function ISF_mixedwood(fuels, isz, pc, sf){
			var check, mult,rsf_d1,rsf_c2,isf_d1,isf_c2;
			var i;

			rsf_c2=sf*fuels.a*Math.pow( (1.0-Math.exp(-1.0*fuels.b*isz)), fuels.c);
			if(rsf_c2>0.0)check=1.0-Math.pow((rsf_c2/(fuels.a)),(1.0/fuels.c) );
			else check=1.0;
			if(check<FBPC_CONST.slopelimit_isi)check=FBPC_CONST.slopelimit_isi;
			isf_c2=(1.0/(-1.0*fuels.b))*Math.log(check);

			if (fuels.fueltype.substr(0,2) == "M2") mult=0.2;
			else mult=1.0;
			//for(i=0;strncmp(fuels.fueltype,"D1",2)!=0 && i<numfuels;fuels++,i++);
			var fuels_d1 = _fuels[get_fueltype_index( "D1")];
			rsf_d1=sf*(mult*fuels_d1.a)*Math.pow( (1.0-Math.exp(-1.0*fuels_d1.b*isz) ),fuels_d1.c);

			if(rsf_d1>0.0)check=1.0-Math.pow((rsf_d1/(mult*fuels_d1.a)),(1.0/fuels_d1.c) );
			else check=1.0;
			if(check<FBPC_CONST.slopelimit_isi)check=FBPC_CONST.slopelimit_isi;
			isf_d1=(1.0/(-1.0*fuels_d1.b))*Math.log(check);

			return  ( ((1.0*pc)/100.0)*isf_c2 + (100-(1.0*pc))/100.0*isf_d1  );
		}

		function ISF_deadfir(fuels, isz, pdf, sf) {
			var check, mult,rsf_d1,rsf_max,isf_d1,isf_max;
			var i;

			rsf_max=sf*fuels.a*Math.pow( (1.0-Math.exp(-1.0*fuels.b*isz)), fuels.c);
			if(rsf_max>0.0)check=1.0-Math.pow((rsf_max/(fuels.a)),(1.0/fuels.c) );
			else check=1.0;
			if(check<FBPC_CONST.slopelimit_isi)check=FBPC_CONST.slopelimit_isi;
			isf_max=(1.0/(-1.0*fuels.b))*Math.log(check);

			if (fuels.fueltype.substr(0,2) == "M4") mult=0.2;
			else mult=1.0;

			//for(i=0;strncmp(fuels.fueltype,"D1",2)!=0 && i<numfuels;fuels++,i++);
			var fuels_d1 = _fuels[get_fueltype_index( "D1")];
			rsf_d1=sf*(mult*fuels_d1.a)*Math.pow( (1.0-Math.exp(-1.0*fuels_d1.b*isz) ),fuels_d1.c);

			if(rsf_d1>0.0)check=1.0-Math.pow((rsf_d1/(mult*fuels_d1.a)),(1.0/fuels_d1.c) );
			else check=1.0;
			if(check<FBPC_CONST.slopelimit_isi)check=FBPC_CONST.slopelimit_isi;
			isf_d1=(1.0/(-1.0*fuels_d1.b))*Math.log(check);

			return  ( ((1.0*pdf)/100.0)*isf_max + ( 100.0-(1.0*pdf) )/100.0*isf_d1  );
		}

		function fire_intensity ( fc, ros) {

			return (300.0*fc*ros);

		}

		function foliar_moisture(x1, at) {
			var latn;
			var nd;
			var lon = _inputs.lon*1;
			var lat = _inputs.lat*1;
			var elev = _inputs.elev*1;
			// these often disagree
			_mains.jd = _inputs.jd;
			// you can pass jd_min and override our calculation if you want. 
			if ('fmc' in _inputs && _inputs.fmc !== false && _inputs.fmc > 0) {
				return _inputs.fmc;
			}
			_mains.jd_min = _inputs.jd_min;
			if(!_inputs.jd_min || _inputs.jd_min<=0)
			{
				 if(elev<0 || !elev)
					{
					 latn=23.4*Math.exp(-0.0360*(150-lon))+46.0;
					 _mains.jd_min=Math.floor(0.5+151.0*lat/latn);
					}
				 else
					{
					 latn=33.7*Math.exp(-0.0351*(150-lon))+43.0;
					 _mains.jd_min=Math.floor(0.5+142.1*lat/latn+(0.0172*elev));
					}
			}
			nd=Math.abs(_inputs.jd - _mains.jd_min);

			if(nd>=50) return(120.0);
			if(nd>=30 && nd<50) return (32.9+3.17*nd-0.0288*nd*nd);
			return(85.0+0.0189*nd*nd);
		}

		function surf_fuel_consump(x1) {
			var sfc,ffc,wfc,bui,ffmc,sfc_c2,sfc_d1;
			var ft = _inputs.fueltype.toUpperCase().substr(0,2);
			bui=_inputs.bui;
			ffmc=_inputs.ffmc;
			if(ft == "C1") {
					/* sfc=1.5*(1.0-exp(-0.23*(ffmc-81.0)));*/
					if(ffmc>84) sfc=0.75+0.75*Math.sqrt(1-Math.exp(-0.23*(ffmc-84) ));
					else  sfc=0.75-0.75*Math.sqrt(1-Math.exp(0.23*(ffmc-84) ) );
				 return (  sfc>=0 ? sfc: 0.0 );
			 }
			if(ft == "C2" || ft == "M3" || ft == "M4")
					return ( 5.0*(1.0-Math.exp(-0.0115*bui)) );
			if(ft == "C3" || ft == "C4")
					return( 5.0 * Math.pow( (1.0-Math.exp(-0.0164*bui)) , 2.24));
			if(ft=="C5" || ft == "C6")
					return( 5.0* Math.pow( (1.0-Math.exp(-0.0149*bui)) , 2.48) );
			if(ft == "C7")
			 {
				ffc=2.0*(1.0-Math.exp(-0.104*(ffmc-70.0)));
				if(ffc<0) ffc=0.0;
				wfc=1.5*(1.0-Math.exp(-0.0201*bui));
				return( ffc + wfc );
			 }
			if(ft == "O1") return( (_inputs.gfl) /* change this*/ ); // lol, never!
			if(ft == "M1" || ft == "M2")
			 {
				sfc_c2=5.0*(1.0-Math.exp(-0.0115*bui));
				sfc_d1=1.5*(1.0-Math.exp(-0.0183*bui));
				sfc=_inputs.pc/100.0*sfc_c2 + (100.0-_inputs.pc)/100.0*sfc_d1;
				return(sfc);
			 }
			if(ft == "S1")
			 {
				ffc=4.0 * (1.0-Math.exp(-0.025*bui));
				wfc=4.0*(1.0-Math.exp(-0.034*bui));
				return ( ffc+wfc);
			 }
			if(ft == "S2")
			 {
				ffc=10.0*(1.0-Math.exp(-0.013*bui));
				wfc=6.0*(1.0-Math.exp(-0.060*bui));
				return (ffc+wfc);
			 }
			if(ft == "S3")
			 {
				ffc=12.0*(1.0-Math.exp(-0.0166*bui));
				wfc=20.0*(1.0-Math.exp(-0.0210*bui));
				return ( ffc+wfc);
			 }
			if(ft == "D1") return ( 1.5*(1.0-Math.exp(-0.0183*bui)));
			if(ft == "D2") return ( bui>=80 ? 1.5*(1.0-Math.exp(-0.0183*bui)) : 0.0);

			console.warn("prob in sfc func \n");
			return(-99);
		}

		function crit_surf_intensity(fuels, fmc) {

		 return ( 0.001*Math.pow(fuels.cbh*(460.0+25.9*fmc),1.5) );
		}

		function critical_ros(ft, sfc, csi) {
			// can't say why gfueltype string is a requirement here.... 
				if(sfc>0)return ( csi/(300.0*sfc) );
				else return(0.0);
		}

		function crown_frac_burn( rss, rso) {
		 var cfb;
		 cfb=1.0-Math.exp(-0.230*(rss-rso));
		 if(  cfb>0 ) return cfb;
		 return 0.0;
		}

		function fire_type( csi, sfi) {

		 return ( sfi>csi ? 'c' : 's' );
		}

		function fire_description(cfb) {
			if(cfb<0.1)return('S');
			if(cfb<0.9 && cfb>=0.1)return('I');
			if(cfb>=0.9)return( 'C' );
			return('*');
		}

		function final_ros(x1, fmc, isi, cfb, rss) {
			var rsc,ros;
			if (_inputs.fueltype.substr(0,2).toUpperCase() == "C6")
			{
			 rsc=foliar_mois_effect(isi,fmc);
			 ros = rss+cfb*(rsc-rss);
			}
			else ros=rss;
			return(ros);
		}

		function foliar_mois_effect( isi, fmc) {
			var fme,rsc;
			var fme_avg = 0.778;
			fme=1000.0*Math.pow(1.5-0.00275*fmc,4.0)/(460.0 + 25.9*fmc);
			rsc=60.0*(1.0-Math.exp(-0.0497*isi))*fme/fme_avg;
			return(rsc);
		}

		function crown_consump(x1, fuels, cfb) {
			var cfc;
			cfc=fuels.cfl*cfb;
			if(fuels.fueltype.trim() == 'M1' || fuels.fueltype.trim()=='M2')
					 cfc = _inputs.pc/100.0*cfc;
			if(fuels.fueltype.trim() == 'M3' || fuels.fueltype.trim()=='M4')
					 cfc = _inputs.pdf/100.0*cfc;
			return(cfc);
		}

		function l_to_b(ft, ws) {
			var ws = ws * 1;
			if(ft.toUpperCase().substr(0,2) == "O1")return( ws<1.0 ? 1.0 : (1.1*Math.pow(ws,0.464)));
			return (1.0 +8.729*Math.pow(1.0-Math.exp(-0.030*ws),2.155));
		}

		function set_all (firepointer, time) {
			 firepointer.time=0;
			 firepointer.rost=firepointer.ros;
			 firepointer.dist=time*firepointer.ros;
			 return firepointer
		}

		function backfire_isi(mainout) {
			var bfw;
			bfw = Math.exp(-0.05039*mainout.wsv);
			return ( 0.208*mainout.ff*bfw);
		}

		function backfire_ros(x1,fuels,at, bisi) {
			var mult=0.0;
			var bros;
			bros=ros_calc(_inputs,fuels,bisi,mult);
			bros *= bui_effect(fuels,at,_inputs.bui);
			return(bros);
		}

		function area( dt, df) {
			var a,b;
			a=dt/2.0;
			b=df;
			return ( a*b*3.1415926/10000.0);
		}

		function perimeter (h, b, sec, lb) {
			// take fire structures h and b and apply values to the secondary out
			// head and back are necessary _inputss.... but not flank? Whatever.

			var mult,p;
			mult=3.1415926*(1.0+1.0/lb)*(1.0+Math.pow(((lb-1.0)/(2.0*(lb+1.0))),2.0));
			p=(h.dist + b.dist)/2.0*mult;
			sec.pgr = (h.rost + b.rost)/2.0*mult;

			return(p);
		}

		function acceleration( x1, cfb) {
			var i;
			var canopy='c';
			var open_list=["O1","C1","S1","S2","S3","o1","c1","s1","s2","s3"];
			// if the fuel type is among these, then return 0.115 = open canopy
			for (var o in open_list) {
				if (_inputs.fueltype == open_list[o]) return 0.115;
			}
			// for(i=0;strncmp(_inputs.fueltype,open_list[i],2)!=0 && i<10;i++);
			// if(i<10) canopy='o';
			// if(canopy=='o') return(0.115);
			return(0.115 -18.8*Math.pow(cfb,2.5)*Math.exp(-8.0*cfb) );
		}

		function flankfire_ros( ros, bros, lb) {
			return  ( (ros+bros)/(lb*2.0) );
		}

		function flank_spread_distance(x1, fuels, sec, hrost, brost, hd, bd, lb, a) {
			sec.lbt=(lb-1.0)*(1.0-Math.exp(-a*_inputs.time)) +1.0;
			fuels.rost=(hrost+brost)/(sec.lbt*2.0);
			return ( (hd+bd)/(2.0*sec.lbt) );
		}

		function spread_distance(x1, fuels, a) {
			fuels.rost= fuels.ros*(1.0-Math.exp(-a*_inputs.time));
			return ( fuels.ros*(_inputs.time+(Math.exp(-a*_inputs.time)/a)-1.0/a));
		}

		function time_to_crown( ros, rso, a) {
			var ratio;
			if(ros>0) ratio= rso/ros; 
			else ratio=1.1;
			if(ratio>0.9 && ratio<=1.0 )ratio=0.9;
			if(ratio<1.0)return Math.floor(Math.log(1.0-ratio)/-1*a);
			else return(99);
		}

		function fire_behaviour(x1, fuels, at, fire) {
			// this compute the behavior for a specific fire (not flank though!)
			var sfi,fi;
			var firetype;
			sfi=fire_intensity(_mains.sfc,fire.rss);
			firetype=fire_type(_mains.csi,sfi);
			if(firetype=='c')
			 {
				 fire.cfb = crown_frac_burn(fire.rss,_mains.rso);
				 fire.fd = fire_description(fire.cfb);
				 fire.ros = final_ros(_inputs,_mains.fmc,fire.isi,fire.cfb,fire.rss);
				 fire.cfc = crown_consump(_inputs,fuels,fire.cfb);
				 fire.fc = fire.cfc + _mains.sfc;
				 fi = fire_intensity(fire.fc,fire.ros);
			 }
			if(firetype!='c' || _mains.covertype=='n')
			 {
				 fire.fc = _mains.sfc;
				 fi = sfi;
				 fire.cfb=0.0;
				 fire.fd='S';
				 fire.ros=fire.rss;
			 }
			return(fi);
		}

		function flank_fire_behaviour(x1, fuels, at, f) {
			var sfi,fi;
			var firetype;
			// compute surface fire intensity from surface fuel consumption and flank rate of spread
			// using ROS gets the exact result, but why?
			sfi = fire_intensity(_mains.sfc, _flanks.rss);
			// get a flank fire type from that. 
			firetype = fire_type(_mains.csi, sfi);
			//console.log(f.rss, _flanks.rss,"sfi=", sfi, firetype)
			if(firetype=='c')
			 {
				//console.log("computing for the c firetype",sfi)
				 _flanks.cfb = crown_frac_burn(_flanks.rss, _mains.rso);
				 _flanks.fd  = fire_description(_flanks.cfb);
				 _flanks.cfc = crown_consump(_inputs,fuels,_flanks.cfb);
				 _flanks.fc  = _flanks.cfc + _mains.sfc;
				 _flanks.fi  = fire_intensity(_flanks.fc, _flanks.ros);
			 }
			if(firetype!='c' || _mains.covertype=='n')
			 {
				//console.log("ffb computing for not c firetype OR n covertype", _flanks.cfb)
				 _flanks.fc  = _mains.sfc;
				 _flanks.fi  = sfi;
				 _flanks.cfb = 0.0;
				 _flanks.fd  = 'S';
			/*   f.ros=f.rss;  removed...v4.5   should not have been here ros set in flankfire_ros()  */
			 }
			return(_flanks.fi);
		}




		// FUELS MANAGEMENT METHODS
		function get_fueltype_index(fueltype) {
			var f;
			for (f in _fuels) {
				if ($.trim(_fuels[f].fueltype.toUpperCase()) == fueltype.toUpperCase()) return f;
			}
			console.warn("invalid fueltype requested");
			return -1;
		}
		function get_fueltype_number(fueltype) {
			if (fueltype.toUpperCase().substr(0,1) == "C" || fueltype.toUpperCase().substr(0,1) == "M") {
				return "c";
			} else {
				return "n";
			}
		}
		// INITIALIZER UTILITIES
		function MainOutputSet() {
			this.sfc = this.csi = this.rso = 
			this.fmc = this.sfi = this.rss = 
			this.isi = this.be = 0.0;
			this.sf = 1.0;
			this.raz = this.wsv = this.ff = 
			this.jd = this.jd_min = 0.0;
			/* initialize covertype as a 3-character string. */
			this.covertype = '  ';
		}
		function SecondaryOutputSet() {
			this.lb = this.area = this.perm = this.pgr = 0.0;
		}
		function FireOutputSet() {
			this.ros  = 0.0; // m/min
			this.dist = 0.0; // m
			this.rost = this.rss = this.ccfb = 
			this.fi = this.fc = this.cfc = this.time = 0.0;
			this.fd   = '';
		}

		function InputSet(seed) {
			// a standard collection of input values
			// setting defaults
			this.fueltype = (seed)?seed.fueltype || 'c1'  : 'c1'
			this.ffmc     = (seed)?seed.ffmc     || 85    : 85
			this.ws       = (seed)?seed.ws       || 0     : 0
			this.bui      = (seed)?seed.bui      || 12    : 12
			this.lat      = (seed)?seed.lat      || 50    : 50
			this.lon      = (seed)?seed.lon      || 110   : 110
			this.wdir     = (seed)?seed.wdir     || 0     : 0
			this.waz      = (seed)?seed.waz      || 0     : 0
			this.ps       = (seed)?seed.ps       || 0     : 0
			this.saz      = (seed)?seed.saz      || 0     : 0
			this.pc       = (seed)?seed.pc       || 0     : 0
			this.pdf      = (seed)?seed.pdf      || 0     : 0
			this.cur      = (seed)?seed.cur      || 0     : 0
			this.gfl      = (seed)?seed.gfl      || 0     : 0
			this.elev     = (seed)?seed.elev     || 0     : 0
			this.time     = (seed)?seed.time     || 0     : 0
			this.jd_min   = (seed)?seed.jd_min   || false : false
			this.mon      = (seed)?seed.mon      || 0     : 0
			this.jd       = (seed)?seed.jd       || 0     : 0
			this.pattern  = (seed)?seed.pattern  || 1     : 1
			// Currently you cannot adjust pattern. 
		}

		/*****************************
		*   Unit converters
		*****************************
			These our standard objects and produce the outputs in
			various englisg output formats, or metric (no conversion)

			They output a new object for safety unless the unit is metric
		*/

		function convert_input(collection, unit) {
			// assuming collection is metric
			var out = new InputSet(collection);
			if (unit == "english" || unit == "english1" || unit == "english2") {
				// inputs just get converted to mph, in all cases
				out.ws = out.ws*0.621371;
			}
			return out;
		}
		function convert_main(collection, unit) {
			/*
			* Main converter does chains/hour for english/english1
			* feet/min for english2
			*/
			var out = new MainOutputSet(collection);
			if (unit == "english" || unit == "english1") {
				// main meter per minute to creates chains and such
				out.wsv = out.wsv * 2.98258;
			} else if (unit == "english2") {
				out.wsv = out.wsv * 3.28084;
			}
			return out;
		}
		function convert_sec(collection, unit) {
			/*
			* Main converter does chains/hour for english/english1
			* feet/min for english2
			*/
			var out = new SecondaryOutputSet(collection);
			if (unit == "english" || unit == "english1" || unit == "english2") {
				// convert area (km^2) to miles squared
				out.area = out.area * 0.386102;
			} 
				
			if (unit == "english" || unit == "english1"){
				// convert perimeter (m) and perimeter growth rate (m/min)
			} else if (unit == "english2") {
				out.wsv = out.perm * 3.28084;
			}
			return out;
		}


		function sequence_calculate() {
			// run all the FBFC calculations! 
			// start by initializing shared storing objects.
			_mains  =  new  MainOutputSet();
			_secs   =  new  SecondaryOutputSet();
			_heads  =  new  FireOutputSet();
			_flanks =  new  FireOutputSet();
			_backs  =  new  FireOutputSet();

			// adjust input wind from meteorological (from) to phyiscal (to) direction
			_inputs.waz = _inputs.wdir + 180;
			if (_inputs.waz >= 360) _inputs.waz -= 360;

			var fuel_type_pointer = _fuels[get_fueltype_index( _inputs.fueltype)];
			// set some global varaibles which are inspected for proper inheritance later on.
			_fbpc_mult = 1.0;

			_mains.covertype  = get_fueltype_number(_inputs.fueltype); // get the index in fueltypes so we know which one to grab in the future.
			_mains.ff         = ffmc_effect(_inputs.ffmc);
			_mains.rss        = rate_of_spread(_inputs, fuel_type_pointer, _mains); // m-per-minute
			_heads.rss        = _mains.rss;
			_mains.sfc        = surf_fuel_consump(_inputs);
			_mains.sfi        = fire_intensity(_mains.sfc, _mains.rss)

			//console.log("Cover Type: ",_mains.covertype)

			if(_mains.covertype=='c') {

				_mains.fmc    = foliar_moisture(_inputs, _mains);
				_mains.csi    = crit_surf_intensity(fuel_type_pointer,_mains.fmc);
				_mains.rso    = critical_ros(_inputs.fueltype,_mains.sfc,_mains.csi);
				var firetype  = fire_type(_mains.csi,_mains.sfi);

				//console.log("Cover type c fire type", firetype)

				if (firetype == 'c') {
					_heads.cfb   =  crown_frac_burn(_mains.rss,_mains.rso);
					_heads.fd    =  fire_description(_heads.cfb);
					_heads.ros   =  final_ros(_inputs,_mains.fmc,_mains.isi,_heads.cfb,_mains.rss);
					_heads.cfc   =  crown_consump(_inputs,fuel_type_pointer,_heads.cfb);
					_heads.fc    =  _heads.cfc + _mains.sfc;
					_heads.fi    =  fire_intensity(_heads.fc,_heads.ros);
				}
			}
			if (_mains.covertype=='n' || firetype=='s') {
				_heads.fd  = 'S';
				_heads.ros = _mains.rss;
				_heads.fc  = _mains.sfc;
				_heads.fi  = _mains.sfi;
				_heads.cfb = 0.0;
			}

			_secs.lb      =  l_to_b(_inputs.fueltype,_mains.wsv);
			_backs.isi    =  backfire_isi(_mains);
			_backs.rss    =  backfire_ros(_inputs,fuel_type_pointer,_mains,_backs.isi);
			_flanks.rss   =  flankfire_ros(_heads.rss, _backs.rss, _secs.lb);
			_backs.fi     =  fire_behaviour(_inputs,fuel_type_pointer,_mains,_backs);
			_flanks.ros   =  flankfire_ros(_heads.ros,_backs.ros,_secs.lb );
			_flanks.fi    =  flank_fire_behaviour(_inputs, fuel_type_pointer, _mains, _flanks);

			if(_inputs.pattern==1 && _inputs.time>0)
				{
					accn           =     acceleration(_inputs,_heads.cfb);
					_heads.dist    =  spread_distance(_inputs,_heads,accn);
					_backs.dist    =  spread_distance(_inputs,_backs,accn);
					_flanks.dist   =  flank_spread_distance(_inputs,_flanks,_secs,
															_heads.rost,_backs.rost,_heads.dist,_backs.dist,
															_secs.lb,accn);

					_heads.time    =  time_to_crown(_heads.ros,_mains.rso,accn);
					_flanks.time   =  time_to_crown(_flanks.ros,_mains.rso,accn);
					_backs.time    =  time_to_crown(_backs.ros,_mains.rso,accn);
				}
			else
				{
					_heads  = set_all(_heads,  _inputs.time);
					_flanks = set_all(_flanks, _inputs.time);
					_backs  = set_all(_backs,  _inputs.time);
				}

			_secs.area  =  area( (_heads.dist + _backs.dist), _flanks.dist);
			
			if(_inputs.pattern==1 && _inputs.time>0) {

				_secs.perm  =  perimeter(_heads, _backs, _secs, _secs.lbt);
			}
			else {
				_secs.perm  =  perimeter(_heads, _backs, _secs, _secs.lb);
			}
			// and some random acceleration thing that was only counted for printing
			var accn = acceleration(_inputs,_heads.cfb);
			_secs.lbt=(_secs.lb-1.0)*(1.0-Math.exp(-accn*_inputs.time)) +1.0;

		 return true;
		}
		function get_result_vals() {
			return {
				main:  _mains, 
				sec:   _secs, 
				head:  _heads, 
				flank: _flanks, 
				back:  _backs, 
				input: _inputs
			};
		}
		function commit(input, val) {
			// this commits an input to a presumably reset FBP set
			var i;
			if (typeof('_inputs') != "object") _inputs = new InputSet();
			if (typeof(input) == "object"){
				// then they passed several named values
				for (i in input) _inputs[i] = input[i]
			} else {
				_inputs[input] = val;
			}
			return true;
		}
		function reset_inputs() {
			_inputs = new InputSet();
		}
		function prepare(fueltype, ffmc, ws, bui, lat, lon, wdir, ps, saz, pc, pdf, cur, gfl, elev, time, date, jd_min, fmc){
			// get all the _inputs structures so they are good and happy
			// defaults
			var mdate;

			reset_inputs(); // not really required.

			_inputs.fueltype = fueltype || 'c1';
			_inputs.ffmc     = ffmc || 85;
			_inputs.ws       = ws || 0;
			_inputs.bui      = bui || 12;
			_inputs.lat      = lat
			_inputs.lon      = lon // positive in the west!
			_inputs.wdir     = wdir
			_inputs.ps       = ps;// percent slope
			_inputs.saz      = saz;// slope azimuth
			_inputs.pc       =  pc;/* percentage conifer of mixedwood stands  m1/m2*/
			_inputs.pdf      = pdf; /* percent dead fir in m3/m4   */
			_inputs.cur      = cur; /* percent cure of grass o1 */
			_inputs.gfl      =  gfl;        /* grass fuel load   */
			_inputs.elev     = elev; /* elevation...only used in the foliar moisture scheme */
			_inputs.time     = time;  /* length of time you want spread calc for...this is
										only important if calculating distance of spread*/
			_inputs.jd_min   = jd_min || false;
			_inputs.fmc      = fmc || false;
			
			// date stuffs
			mdate = date.clone() || moment();
			mdate.year(1900); // prevents leapyears
			_inputs.mon      = mdate.month();
			_inputs.jd       = mdate.dayOfYear(); // julian daty
			//_inputs.pattern = 1; //// oooook?

			
			// extract fuel coefficients
			_fuels = setup_const(); // from the coefficients script at the moment.


			sequence_calculate();
			return get_result_vals();

		}


		function update() {
				// meh
		}

	 _fbpc            = prepare;
	 _fbpc.update     = update;
	 _fbpc.commit     = commit;
	 _fbpc.version    = VERSION;
	 // data access
	 _fbpc.results     = get_result_vals;

	 cffdrs.fbpc = _fbpc;
	 return cffdrs;

}));





