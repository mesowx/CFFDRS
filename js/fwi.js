/*
*
*   Canadian Forest Fire Danger Rating System calculations in JavaScript
*   Specifically, the fire weather index system.
*
*   Created for Alaska Fire & Fuels, by MesoWest
*
*   Author: Joe Young 
*   Date: 25 January 2016
*   Mod: 28 June 2016
*   Mod: 27 April 2017
*/

;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.cffdrs = factory()
}(this, function () { 'use strict';
    /*
    *  DEFINE THE cffdrs.fwi NODES
    */
    "use strict";

    var _cffdrs, _fwi;

    var cffdrs_el = [6.5,7.5,9.0,12.8,13.9,13.9,12.4,10.9,9.4,8.0,7.0,6.0];
    var cffdrs_fl = [-1.6,-1.6,-1.6,0.9,3.8,5.8,6.4,5.0,2.4,0.4,-1.6,-1.6];

    function _ffmc(temps, rhs, wss, rains, ffmc_olds, month, hourly) {
        // Fine Fuels Moisture Code
        var ra,wmo,wmo_add, z,x,wm,ed,ew,ffmcs;
        wmo = 147.2*(101.-ffmc_olds)/(59.5+ffmc_olds);
        
        if (rains > 0.5) {
            ra = rains - 0.5;
            if (wmo>150.) wmo_add = 42.5*ra*Math.exp(-100.0/(251.-wmo))*(1.0-Math.exp(-6.93/ra))+0.0015*(wmo-150.)*(wmo-150.)*Math.sqrt(ra);
            else wmo_add = 42.5*ra*Math.exp(-100.0/(251.-wmo))*(1.0-Math.exp(-6.93/ra));
            wmo+=wmo_add;
        }

        if (wmo>250.) wmo = 250.0;
        ed=0.942 * Math.pow(rhs,0.679) + (11.0*Math.exp((rhs-100.0)/10.0)) + 0.18 * (21.1-temps) * (1.0-1.0/Math.exp(rhs*0.115));
        ew=0.618 * Math.pow(rhs,0.753) + (10.0*Math.exp((rhs-100.0)/10.0)) + 0.18 * (21.1-temps) * (1.0-1.0/Math.exp(rhs*0.115));
        
        wm=wmo

        if (wmo < ed && wmo < ew) {
            z = 0.424 * ( 1.0 - Math.pow((100.0-rhs)/100.0,1.7)) + 0.0694 * Math.sqrt(wss) * (1.0 - Math.pow(((100.0-rhs)/100.0),8.0 ));
            
            if (hourly) {
                x = z * 0.0579 * Math.exp(0.0365*temps)
                wm = ew + (wmo-ew) * Math.exp(-2.303*x)
            } else {
                x = z * 0.581 * Math.exp(0.0365*temps);
                wm = ew + (wmo-ew) / Math.pow(10.0,x);
            }
            
        } else if (wmo > ed) {
            z = 0.424 * ( 1.0 - Math.pow((rhs/100.),1.7 )) + 0.0694 * Math.sqrt(wss) * ( 1 - Math.pow((rhs/100.),8.0 ));
            
            if (hourly) {
                x = z * 0.0579 * Math.exp(0.0365*temps)
                wm = ed + ( wmo - ed) * Math.exp(-2.303*x)
            } else {
                x = z * 0.581 * Math.exp(0.0365*temps);
                wm = ed + ( wmo - ed) / Math.pow(10.0,x);  
            }
            
        }
        // what happens if wmo > ew but < ed... is that not possible?!
        ffmcs = 59.5 * (250.0 - wm) / (147.2 + wm);
        if (ffmcs > 101.0) ffmcs = 101.0;
        if (ffmcs < 0.0) ffmcs = 0;
        return ffmcs;

    }
    function _hffmc(temps, rhs, wss, rains, hffmc_olds, month) {
        // convenient wrapper for VanWagner computation.
        return _ffmc(temps, rhs, wss, rains, hffmc_olds, month, true);
    }
    function _dmc(t,r,p,dmc_olds,month) {
        // Duff Moisture Code
        var rk, pr, ra, rw, b, dmc, wmi, wmr;
        if (t< -1.1) t=1.1;
        rk = 1.894 * (t + 1.1) * (100.0 - r) * cffdrs_el[month-1] * 0.0001
        pr = 0;
        if (p < 1.5) pr = dmc_olds;
        else {
            ra = p;
            rw = 0.92 * ra - 1.27;
            wmi = 20.0 + 280.0 / Math.exp(0.023 * dmc_olds);
            if (dmc_olds>65.) b = 6.2 * Math.log(dmc_olds) - 17.2;
            else if (dmc_olds<=65. && dmc_olds>33.) b = 14.0 - 1.3 * Math.log(dmc_olds);
            else  b = 100.0 / (0.5 + 0.3 * dmc_olds);
            wmr = wmi + 1000.0 * rw / (48.77 + b * rw);
            pr = 43.43 * (5.6348 - Math.log(wmr-20.));
        }
        if (pr<0.) pr = 0.;
        dmc = pr + rk;
        if (dmc<0.) dmc = 0.;
        return dmc;
    }
    function _dc(temps, rains, dc_olds, month) {
        // Drought Code - this is probably not a very safe function name...
        var t, rains, dc_olds, pe, dr, ra, rw, smi, qr, dr, v, dc;
        t = +temps;
        rains = +rains;
        dc_olds = dc_olds;
        if (t < -2.8) t = -2.81;
        pe = (.36 * (t + 2.8) + cffdrs_fl[month-1]) / 2.0
        if (pe<0.0) pe = 0.0
        
        dr = dc_olds
        if (rains <= 2.801) dr = dc_olds;
        else if (rains>2.801){
            ra = rains;
            rw = 0.83 * ra - 1.27;
            smi = 800. * Math.exp(-dc_olds / 400.);
            qr = smi + 3.937 * rw;
            dr = 400. * Math.log(800. / qr);
        }
        if (dr<0.0) dr = 0.0;
        v = 0.36 * (t + 2.8) + cffdrs_fl[month - 1]
        if (v<0.0) v = 0.0;
        dc = dr + v * 0.5;
        if (dc<0.0) dc = 0.0;
        return dc

    }
    function _isi(ffmcs, wspd) {
        // initial spread index
        var fm, sf, isi;
        fm = 147.2 * (101.0 - ffmcs) / (59.5 + ffmcs);
        sf = 19.115 * Math.exp(-0.1386 * fm) * (1.0 + Math.pow(fm,5.31) / 4.93e07);
        isi = sf * Math.exp(0.05039 * wspd);
        return isi;

    }
    function _bui(dmc, dc) {
        // build up index
        var bui = 0;
        var dmc = +dmc;
        var dc = +dc;
        if (dmc <= 0.4 * dc) bui = 0.8 * dc * dmc / (dmc + 0.4 * dc);
        else bui = dmc - (1. - 0.8 * dc / (dmc + 0.4 * dc)) * (0.92 + Math.pow((0.0114 * dmc),1.7));
        if (bui<0.) bui = 0.0;
        if (dmc == 0 && dc == 0) bui = 0.;
        return bui;
    }
    function _fwidsr(bui, isi) {
        // fire weather index
        // DEPRECATED - use the specific FWI/DSR functions
        console.warn("the combined FWI/DSR function is deprecated, and will be removed in a future release. Please use .fwi([bui,isi]) and .dsr([fwi]) instead.");
        var fwi, dsr;
        fwi = _fwi(bui, isi);
        dsr = _dsr(fwi);

        return [fwi, dsr]
    }
    function _fwi_index(bui, isi) {
        var bb, fwi;
        if (bui>80.) bb = 0.1 * isi * (1000.0 / (25.0 + 108.64 / Math.exp(0.023*bui)))
        else bb = 0.1 * isi * (0.626 * Math.pow(bui,0.809) + 2.0)
        
        if (bb<=1.) {fwi = bb;}
        else {
            fwi = Math.exp(2.72 * Math.pow(0.434 * Math.log(bb),0.647));
        }
        return fwi;
    }
    function _dsr(fwi) {
        var dsr;
        dsr = 0.0272 * Math.pow(fwi,1.77);
        return dsr;
    }

    function _gfmc_gisi(temps, rhs, wss, rains, solr, gfmc_olds) {
        var xm, ed, ew, e, a1, moe;
        var rhofl = 0.3;
        var solr = solr/1000.;
        var mo = 147.2772 * (101 - gfmc_olds) / (59.5 + gfmc_olds);
        if (rains > 0) {
            mo += rains * 100 / rhofl;
            if (mo>250)  mo = 250;
        }
        var tf = temps + 35.07 * solr / Math.exp(0.06215 * wss);
        var est = 6.107 * Math.pow(10,(7.5 * temps/(237 + temps)));
        var estf = 6.107 * Math.pow(10,(7.5 * tf/(237 + tf)));
        var rhf = rhs * est/estf;
        
        
        ed = 1.62 * Math.pow(rhf,0.532) + (13.7 * Math.exp((rhf-100)/13.0)) + 0.27*(26.67-tf) * (1.0 - 1.0/Math.exp(0.115*rhf));
        var moed = mo - ed;
        ew = 1.42 * Math.pow(rhf,0.512) + (12.0 * Math.exp((rhf-100)/18.0)) + 0.27*(26.67-tf) * (1.0 - 1.0/Math.exp(0.115*rhf));
        var moew = mo - ew;

        
        if (moed == 0 || (moew>=0 && moed<0)) {
            xm = mo
            if (moed == 0) e = ed;
            if (moew >= 0) e = ew;
        } else {
            if (moed > 0) {
                a1 = rhs/100;
                e = ed;
                moe = moed;
            } else {
                a1 = (100.0 - rhs)/100.0;
                e = ew;
                moe = moew;
            }
            var xkd = 0.424 * (1 - Math.pow(a1,1.7)) + (0.0694 * Math.sqrt(wss) * (1 - Math.pow(a1,8)));
            xkd = xkd * 0.897 * Math.exp(0.0365*tf);
            xm = e + moe * Math.exp(-xkd);
        }
        mo = xm;
        var gfmc = 59.5 * (250 - xm)/(147.2772 + xm);
        

        var gm = 147.2 * (101.0 - gfmc) / (59.5 + gfmc);

        if (gm >= 0.0) {
            var gsf = 19.115 * Math.exp(-0.1386 * gm) * (1.0 + Math.pow(gm,5.31) / 4.93e7);
            var gisi = gsf * Math.exp(0.05039 * wss);
        } else {
            var gisi = 0;
        }
        return [gfmc,gisi];
    }

    function _gfmc(temps,rhs,wss,rains,solr,gfmc_olds) {
        return _gfmc_gisi(temps,rhs,wss,rains,solr,gfmc_olds)[0];
    }
    function _gisi(temps,rhs,wss,rains,solr,gfmc_olds) {
        return _gfmc_gisi(temps,rhs,wss,rains,solr,gfmc_olds)[1];
    }

    function FWI() {
        //
        return _fwi;
    }

    function CFFDRS() {
        //
        return _cffdrs;
    }

    /**************************
    *   Define the namespace
    **************************/
    _fwi = FWI;
    _fwi.ffmc  = _ffmc;
    _fwi.hffmc = _hffmc;
    _fwi.dmc   = _dmc;
    _fwi.dc    = _dc;
    _fwi.isi   = _isi;
    _fwi.bui   = _bui;
    _fwi.fwi   = _fwi_index;
    _fwi.dsr   = _dsr;
    _fwi.gfmc  = _gfmc;
    _fwi.gisi  = _gisi;


    /**************************
    *   CFFDRS Namespace
    **************************/
    _cffdrs     = CFFDRS;
    _cffdrs.fwi = _fwi;

    return _cffdrs;


}));


