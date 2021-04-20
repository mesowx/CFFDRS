"""
    Python implementation of the CFFWI equations for Alaska Fire & Fuels
"""

import numpy as np
el = (6.5,7.5,9.0,12.8,13.9,13.9,12.4,10.9,9.4,8.0,7.0,6.0)
fl = (-1.6,-1.6,-1.6,0.9,3.8,5.8,6.4,5.0,2.4,0.4,-1.6,-1.6)

def mask_fields(*fields, **kwargs):
    """
    derive a mask to eliminate all nan points from the given field and return filtered fields
    and the mask itself

    The ignore keyword argument can be used to skip including certain variables in the mask computation
    However you will want to give us a value to replace any nans found in that field. The value of 
    ignore is a dictionary where the key is the index of the provided variable. So if you want us to
    skip the third variable, then ignore={2:0} which will instruct us to not include it in the mask, and
    simply replace it's nan's with 0s (popular for precip).

    A value of None will instruct us to use the nanmean of the given field as the replacement value.

    """
    if "ignore" in kwargs:
        ignore = kwargs['ignore']
    else:
        ignore = {}
    mask = np.zeros_like(fields[0])
    i = 0
    for f in fields:
        if i in ignore:
            replace = ignore[i]
            if replace is None:
                replace = np.nanmean(f)
            fields[i][np.isnan(f)] = replace
        else:
            # if not ignored, then use it in the mask computation!
            mask += np.isnan(f)
        i+=1
    mask = mask.astype(bool)
    output = [mask]
    for f in fields:
        output.append(f[~mask])
    return output

def calc_dmc(temps,rhs,rains,dmc_olds,month):
    if type(temps) == type(np.array([0])):
       
        mask, t, rhs, rains, dmc_olds = mask_fields(temps, rhs, rains, dmc_olds, ignore={0:None, 1:None, 2:0})
        dmc_out = np.zeros_like(temps) * np.nan

        t[t<-1.1] = -1.1
        rk = 1.894 * (t + 1.1) * (100.0 - rhs) * el[int(month)-1] * 0.0001
        pr = np.zeros_like(t)
        pr[rains<=1.5] = dmc_olds[rains<=1.5]
        ra = rains
        rw = 0.92 * ra - 1.27
        wmi = 20.0 + 280.0 / np.exp(0.023 * dmc_olds)
        
        dmco65 = dmc_olds>65.
        dmco33 = dmc_olds>33.
        
        b = 100.0 / (0.5 + 0.3 * dmc_olds)
        b[dmco65] = 6.2 * np.log(dmc_olds[dmco65]) - 17.2
        b[~dmco65 & dmco33] = 14.0 - 1.3 * np.log(dmc_olds[~dmco65 & dmco33])
        wmr = wmi + 1000.0 * rw / (48.77 + b * rw)
        pr[rains>1.5] = 43.43 * (5.6348 - np.log(wmr[rains>1.5]-20.))
        
        pr[pr<0.] = 0.
        dmc = pr + rk
        dmc[dmc<0.] = 0.

        dmc_out[~mask] = dmc
        return dmc_out
    else:
        t = temps
        if t<-1.1: t = -1.1
        rk = 1.894 * (t + 1.1) * (100.0 - rhs) * el[int(month)-1] * 0.0001
        pr = 0
        if rains<=1.5: pr = dmc_olds
        else:
            ra = rains
            rw = 0.92 * ra - 1.27
            wmi = 20.0 + 280.0 / np.exp(0.023 * dmc_olds)
            
            if dmc_olds>65.: b = 6.2 * np.log(dmc_olds) - 17.2
            elif dmc_olds<=65. and dmc_olds>33.: b = 14.0 - 1.3 * np.log(dmc_olds)
            else: b = 100.0 / (0.5 + 0.3 * dmc_olds)
            wmr = wmi + 1000.0 * rw / (48.77 + b * rw)
            pr = 43.43 * (5.6348 - np.log(wmr-20.))
        
        if pr<0.: pr = 0.
        dmc = pr + rk
        if dmc<0.: dmc = 0.
        return dmc

def calc_ffmc(temps,rhs,wss,rains,ffmc_olds,month,hourly=False):
    if type(temps) == type(np.array([0])):
        ffmc_out = np.zeros_like(temps) * np.nan # start ffmc off as being just nans
        # create a nan mask to not even consider any field elements which are nans!
        mask, temps, rhs, wss, rains, ffmc_olds = mask_fields(temps, rhs, wss, rains, ffmc_olds, ignore={0:None, 1:None, 2:None, 3:0})

        wmo = 147.2*(101.-ffmc_olds)/(59.5+ffmc_olds)
        r = np.where(rains>0.5)
        ra = rains[r] - 0.5
        wmo_r = wmo[r]
        wmo_add = np.where(wmo_r>150.,
            42.5*ra*np.exp(-100.0/(251.-wmo_r))*(1.0-np.exp(-6.93/ra))+0.0015*(wmo_r-150.)*(wmo_r-150.)*np.sqrt(ra),
            42.5*ra*np.exp(-100.0/(251.-wmo_r))*(1.0-np.exp(-6.93/ra))
            )
        wmo_r+=wmo_add
        wmo[r]=wmo_r
        wmo = np.where(wmo>250.,250,wmo)
        ed=0.942 * rhs**0.679 + (11.0*np.exp((rhs-100.0)/10.0)) + 0.18 * (21.1-temps) * (1.0-1.0/np.exp(rhs*0.115))
        ew=0.618 * rhs**0.753 + (10.0*np.exp((rhs-100.0)/10.0)) + 0.18 * (21.1-temps) * (1.0-1.0/np.exp(rhs*0.115))
        
        wm=wmo
        r = np.where((wmo<ed) & (wmo<ew))
        r2 = np.where((wmo>ed))
        
        if len(r[0]>0):
            z = 0.424 * ( 1.0 - ((100.0-rhs[r])/100.0)**1.7 ) + 0.0694 * np.sqrt(wss[r]) * (1.0 - ((100.0-rhs[r])/100.0)**8.0 )
            if hourly:
                # x = z * 0.0579 * np.exp(0.0365*temps[r2])
                # wm_r2 = ed[r2] + ( wmo[r2] - ed[r2]) * np.exp(-2.303*x)
                x = z * 0.0579 * np.exp(0.0365*temps[r])
                wm_r = ew[r] + (wmo[r]-ew[r]) * np.exp(-2.303*x)
            else:
                x = z * 0.581 * np.exp(0.0365*temps[r])
                wm_r = ew[r]-(ew[r]-wmo[r]) / (10.0**x)
            wm[r]=wm_r
        
        if len(r2[0]>0):
            z = 0.424 * ( 1.0 - (rhs[r2]/100.)**1.7 ) + 0.0694 * np.sqrt(wss[r2]) * ( 1 - (rhs[r2]/100.)**8.0 )
            if hourly:
                x = z * 0.0579 * np.exp(0.0365*temps[r2])
                wm_r2 = ed[r2] + ( wmo[r2] - ed[r2]) * np.exp(-2.303*x)
            else:
                x = z * 0.581 * np.exp(0.0365*temps[r2])
                wm_r2 = ed[r2] + ( wmo[r2] - ed[r2]) / (10.0**x)
            wm[r2]=wm_r2
        
        ffmcs = 59.5 * (250.0 - wm) / (147.2 + wm)
        ffmcs = np.where(ffmcs>101.0,101.0,ffmcs)
        ffmcs = np.where(ffmcs<0.,0.,ffmcs)
        
        ffmc_out[~mask] = ffmcs
        #before = ffmcs
        return ffmc_out
        
    else:
        wmo = 147.2*(101.-ffmc_olds)/(59.5+ffmc_olds)
        if rains>0.5:
            ra = rains - 0.5
            if wmo>150.: wmo_add = 42.5*ra*np.exp(-100.0/(251.-wmo))*(1.0-np.exp(-6.93/ra))+0.0015*(wmo-150.)*(wmo-150.)*np.sqrt(ra)
            else: wmo_add = 42.5*ra*np.exp(-100.0/(251.-wmo))*(1.0-np.exp(-6.93/ra))
            wmo+=wmo_add
            
        if wmo>250.: wmo = 250.
        ed=0.942 * rhs**0.679 + (11.0*np.exp((rhs-100.0)/10.0)) + 0.18 * (21.1-temps) * (1.0-1.0/np.exp(rhs*0.115))
        ew=0.618 * rhs**0.753 + (10.0*np.exp((rhs-100.0)/10.0)) + 0.18 * (21.1-temps) * (1.0-1.0/np.exp(rhs*0.115))
        
        wm=wmo
        #order of conditions
        if wmo<ed and wmo<ew:
            z = 0.424 * ( 1.0 - ((100.0-rhs)/100.0)**1.7 ) + 0.0694 * np.sqrt(wss) * (1.0 - ((100.0-rhs)/100.0)**8.0 )
            if hourly:
                x = z * 0.0579 * np.exp(0.0365*temps)
                wm = ew + (wmo-ew) * np.exp(-2.303*x)
            else:
                x = z * 0.581 * np.exp(0.0365*temps)
                wm = ew + (wmo-ew) / (10.0**x)
        elif wmo>ed:
            z = 0.424 * ( 1.0 - (rhs/100.)**1.7 ) + 0.0694 * np.sqrt(wss) * ( 1 - (rhs/100.)**8.0 )
            if hourly:
                x = z * 0.0579 * np.exp(0.0365*temps)
                wm = ed + ( wmo - ed) * np.exp(-2.303*x)
            else:
                x = z * 0.581 * np.exp(0.0365*temps)
                wm = ed + ( wmo - ed) / (10.0**x)
        
        ffmcs = 59.5 * (250.0 - wm) / (147.2 + wm)
        if ffmcs>101.0:    ffmcs = 101.0
        elif ffmcs<0.: ffmcs = 0.
        return ffmcs
    
def calc_gfmc_gisi(temps,rhs,wss,rains,solr,gfmc_olds,month):
    #print temps,rhs,wss,rains,solr,gfmc_olds,month
    rhofl = 0.3
    solr = solr/1000.
    #if solr > 1.0:
    #    solr = 1.0
    mo = 147.2772 * (101 - gfmc_olds) / (59.5 + gfmc_olds)
    if rains > 0:
        mo += rains * 100 / rhofl
        if mo>250:
            mo = 250
    
    tf = temps + 35.07 * solr / np.exp(0.06215 * wss)
    est = 6.107 * 10**(7.5 * temps/(237 + temps))
    estf = 6.107 * 10**(7.5 * tf/(237 + tf))
    rhf = rhs * est/estf
    
    ed = 1.62 * rhf**0.532 + (13.7 * np.exp((rhf-100)/13.0)) + 0.27*(26.67-tf) * (1.0 - 1.0/np.exp(0.115*rhf))
    moed = mo - ed
    ew = 1.42 * rhf**0.512 + (12.0 * np.exp((rhf-100)/18.0)) + 0.27*(26.67-tf) * (1.0 - 1.0/np.exp(0.115*rhf))
    moew = mo - ew
    
    if moed == 0 or (moew>=0 and moed<0):
        xm = mo
        if moed == 0:
            e = ed
        if moew >= 0:
            e = ew
    else:
        if moed > 0:
            a1 = rhs/100
            e = ed
            moe = moed
        else:
            a1 = (100.0 - rhs)/100.0
            e = ew
            moe = moew
        xkd = 0.424 * (1 - a1**1.7) + (0.0694 * np.sqrt(wss) * (1 - a1**8))
        xkd = xkd * 0.897 * np.exp(0.0365*tf)
        xm = e + moe * np.exp(-xkd)
    
    mo = xm
    gfmc = 59.5 * (250 - xm)/(147.2772 + xm)
    gm = 147.2 * (101.0 - gfmc) / (59.5 + gfmc)
    #print 'gm from calc_gfmc_gisi', gm, gfmc
    if gm >= 0.0:
        gsf = 19.115 * np.exp(-0.1386 * gm) * (1.0 + gm**5.31 / 4.93e07)
        gisi = gsf * np.exp(0.05039 * wss)
    else:
        gisi = 0
    return gfmc,gisi

def calc_dc(temps,rains,dc_olds,month):
    if type(temps) == type(np.array([0])):
        
        mask, t, ra, dr = mask_fields(temps, rains, dc_olds, ignore={0:None, 1:0})
        dc_out = np.zeros_like(temps) * np.nan

        t[t<-2.8] = -2.81
        pe = (.36 * (t + 2.8) + fl[int(month)-1]) / 2.0
        pe[pe<0.0] = 0.0
        
        rw = 0.83 * ra - 1.27
        smi = 800. * np.exp(-dr / 400.)
        qr = smi + 3.937 * rw
        dr[ra>2.801] = 400. * np.log(800. / qr[ra>2.801])
        dr[dr<0.0] = 0.0
        v = 0.36 * (t + 2.8) + fl[int(month) - 1]
        v[v<0.0] = 0.0
        dc = dr + v * 0.5
        dc[dc<0.0] = 0.0
        
        dc_out[~mask] = dc
        return dc_out

    else:
        t = temps
        if t<-2.8: t = -2.81
        pe = (.36 * (t + 2.8) + fl[int(month)-1]) / 2.0
        if pe<0.0: pe = 0.0
        
        dr = dc_olds
        if rains<=2.801: dr = dc_olds
        elif rains>2.801:
            ra = rains
            rw = 0.83 * ra - 1.27
            smi = 800. * np.exp(-dc_olds / 400.)
            qr = smi + 3.937 * rw
            dr = 400. * np.log(800. / qr)
        if dr<0.0: dr = 0.0
        v = 0.36 * (t + 2.8) + fl[int(month) - 1]
        if v<0.0: v = 0.0
        dc = dr + v * 0.5
        if dc<0.0: dc = 0.0

        return dc
        
def calc_isi(ffmcs,wss,month):
    # this can be too small a dtype for this process to handle!
    if type(ffmcs) == type(np.array([0])):
        ffmcs = ffmcs.astype(np.float32)
        wss = wss.astype(np.float32)

    fm = 147.2 * (101.0 - ffmcs) / (59.5 + ffmcs)
    sf = 19.115 * np.exp(-0.1386 * fm) * (1.0 + fm**5.31 / 4.93e07)
    isi = sf * np.exp(0.05039 * wss)

    return isi
        
def calc_bui(dmcs,dcs,month):
    

    if type(dmcs) == type(np.array([0])):


        # dmcs = dmcs.astype(np.float64)
        # dcs = dcs.astype(np.float64)
        bui_out = np.zeros_like(dmcs) * np.nan

        mask, dmcs, dcs = mask_fields(dmcs, dcs)
        buis = np.zeros_like(dmcs)

        search1 = dmcs <= 0.4 * dcs

        if np.any(search1):
            buis[search1] = 0.8 * dcs[search1] * dmcs[search1] / (dmcs[search1] + 0.4 * dcs[search1])
        if not np.all(search1):
            buis[~search1] = dmcs[~search1] - (1. - 0.8 * dcs[~search1] / (dmcs[~search1] + 0.4 * dcs[~search1])) * (0.92 + (0.0114 * dmcs[~search1])** 1.7)
        
        buis[buis < 0.] = 0.
        dmcs0 = dmcs<0.01
        dcs0 = dcs<0.01
        buis[dmcs0 & dcs0] = 0.
        bui_out[~mask] = buis
        return bui_out
    else:
        buis = 0
        if dmcs <= 0.4 * dcs: buis = 0.8 * dcs * dmcs / (dmcs + 0.4 * dcs)
        else: buis = dmcs - (1. - 0.8 * dcs / (dmcs + 0.4 * dcs)) * (0.92 + (0.0114 * dmcs)** 1.7)
        if buis<0.: buis = 0.
        if int(dmcs) == 0 and int(dcs) == 0: buis = 0.
        return buis
        
def calc_fwi_dsr(buis,isis,month):
    if type(buis) == type(np.array([0])):
        fwis_out = np.zeros_like(buis) * np.nan
        mask, buis, isis = mask_fields(buis, isis)
        bb = np.zeros_like(buis)
        fwis = np.zeros_like(buis) 

        bb[buis>80.] = 0.1 * isis[buis>80.] * (1000.0 / (25.0 + 108.64 / np.exp(0.023*buis[buis>80.])))
        bb[buis<=80.] = 0.1 * isis[buis<=80.] * (0.626 * buis[buis<=80.]**0.809 + 2.0)
        
        fwis[bb<=1.] = bb[bb<=1.]
        fwis[bb>1.] = np.exp(2.72 * (0.434 * np.log(bb[bb>1.]))**0.647)
        dsrs = 0.0272 * fwis**1.77

        fwis_out[~mask] = fwis
        # we do not do gridded DSR, so we simply return false
        return fwis_out, False

    else:
        if buis>80.: bb = 0.1 * isis * (1000.0 / (25.0 + 108.64 / np.exp(0.023*buis)))
        else: bb = 0.1 * isis * (0.626 * buis**0.809 + 2.0)
        
        if bb<=1.: fwis = bb
        else: fwis = np.exp(2.72 * (0.434 * np.log(bb))**0.647)
        dsrs = 0.0272 * fwis**1.77

        return fwis, dsrs
