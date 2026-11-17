"""50 lead-to-payment scenarios for the M6 Freight test site.
postcodes.io is mocked (shell can't reach it) with approximate real coordinates;
unknown postcodes return 404 so the engine's fallback path is exercised.
Nothing is sent: wa.me / Stripe links are read, never opened."""
import asyncio, json, re, sys, urllib.parse, datetime as dt
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8766/"
PC = {  # postcode/outcode/place -> (lat,lng,district)
 "WV11AA":(52.586,-2.128,"Wolverhampton"),"WV24AA":(52.575,-2.120,"Wolverhampton"),"B11AA":(52.4796,-1.9026,"Birmingham"),
 "DY11AA":(52.512,-2.087,"Dudley"),"WS11AA":(52.585,-1.982,"Walsall"),"TF34NT":(52.676,-2.443,"Telford and Wrekin"),
 "ST162AA":(52.807,-2.117,"Stafford"),"WS111AA":(52.689,-2.031,"Cannock Chase"),"DY101AA":(52.388,-2.249,"Wyre Forest"),
 "M11AE":(53.481,-2.236,"Manchester"),"CM233NA":(51.870,0.160,"East Hertfordshire"),"DH11AA":(54.776,-1.575,"County Durham"),
 "EC1V2NX":(51.527,-0.088,"Islington"),"SW1A1AA":(51.501,-0.141,"Westminster"),"EH11AA":(55.953,-3.189,"City of Edinburgh"),
 "IV11AA":(57.480,-4.225,"Highland"),"KW151AA":(58.981,-2.960,"Orkney Islands"),"BT11AA":(54.597,-5.930,"Belfast"),
 "PO301AA":(50.700,-1.290,"Isle of Wight"),"TR182AA":(50.120,-5.530,"Cornwall"),"CF101AA":(51.480,-3.180,"Cardiff"),
 "LS11AA":(53.797,-1.547,"Leeds"),"BS11AA":(51.454,-2.597,"Bristol"),"NG11AA":(52.953,-1.150,"Nottingham"),
 "CV11AA":(52.408,-1.510,"Coventry"),"B707AA":(52.518,-1.995,"Sandwell"),"WV164AA":(52.534,-2.420,"Shropshire"),
 "HS12AA":(58.210,-6.390,"Na h-Eileanan Siar"),"IM11AA":(54.150,-4.480,"Isle of Man"),
 "out:WV1":(52.586,-2.128,"Wolverhampton"),"out:B1":(52.4796,-1.9026,"Birmingham"),"out:M1":(53.481,-2.236,"Manchester"),
 "out:DY1":(52.512,-2.087,"Dudley"),"out:TF3":(52.676,-2.443,"Telford and Wrekin"),
 "place:wolverhampton":(52.586,-2.128,"Wolverhampton"),"place:birmingham":(52.48,-1.90,"Birmingham"),
 "place:telford":(52.676,-2.443,"Telford and Wrekin"),"place:walsall":(52.585,-1.982,"Walsall"),"place:leeds":(53.797,-1.547,"Leeds"),
}
async def mock(route):
    u = urllib.parse.urlparse(route.request.url); path = urllib.parse.unquote(u.path).upper().replace(" ", "")
    key = None; body = None
    if path.startswith("/POSTCODES/"):
        k = path.split("/")[2]; r = PC.get(k)
        if r: body = {"result": {"latitude": r[0], "longitude": r[1], "postcode": k[:-3] + " " + k[-3:], "admin_district": r[2]}}
    elif path.startswith("/OUTCODES/"):
        k = path.split("/")[2]; r = PC.get("out:" + k)
        if r: body = {"result": {"latitude": r[0], "longitude": r[1], "outcode": k, "admin_district": [r[2]]}}
    elif path.startswith("/PLACES"):
        q = urllib.parse.parse_qs(u.query).get("q", [""])[0].lower().strip(); r = PC.get("place:" + q)
        body = {"result": [{"latitude": r[0], "longitude": r[1], "name_1": q.title(), "county_unitary": r[2]}] if r else []}
    if body is None: return await route.fulfill(status=404, body='{"status":404}', content_type="application/json")
    await route.fulfill(status=200, body=json.dumps(body), content_type="application/json")

T = dt.date.today()
def d(n): return (T + dt.timedelta(days=n)).isoformat()
def nextwd(wd):  # next given weekday (0=Mon) at least 2 days out
    x = T + dt.timedelta(days=2)
    while x.weekday() != wd: x += dt.timedelta(days=1)
    return x.isoformat()
OK = dict(name="Sam Patel", phone="07700 900123", af="1 Test St", at="2 Test Rd", terms=True)
S = [  # id, from, to, items, when, extra, expect
 (1,"WV1 1AA","WV2 4AA","sofa, 6 boxes","tomorrow",{},"local"),
 (2,"WV1 1AA","B1 1AA","2 sofas, fridge, 10 boxes","tomorrow",{},"local"),
 (3,"DY1 1AA","WS1 1AA","double bed, wardrobe","tomorrow",{"helpers":0},"local"),
 (4,"WV1 1AA","TF3 4NT","armchair","tomorrow",{},"local"),
 (5,"B1 1AA","M1 1AE","armchair","tomorrow",{"pay":"deposit"},"trip"),
 (6,"B1 1AA","M1 1AE","armchair","tomorrow",{"pay":"full"},"trip"),
 (7,"WV1 1AA","CM23 3NA","washing machine","tomorrow",{"pay":"invoice"},"trip"),
 (8,"DH1 1AA","CM23 3NA","3 seater sofa","tomorrow",{},"trip"),
 (9,"WV1 1AA","EC1V 2NX","10 boxes","tomorrow",{"flex":True},"trip"),
 (10,"WV1 1AA","EH1 1AA","king bed, mattress","tomorrow",{},"trip"),
 (11,"WV1 1AA","IV1 1AA","desk","tomorrow",{},"trip"),
 (12,"WV1 1AA","KW15 1AA","chair","tomorrow",{},"err-ferry"),
 (13,"WV1 1AA","BT1 1AA","sofa","tomorrow",{},"err-ferry"),
 (14,"WV1 1AA","PO30 1AA","sofa","tomorrow",{},"err-ferry"),
 (15,"WV1 1AA","HS1 2AA","sofa","tomorrow",{},"err-ferry"),
 (16,"WV1 1AA","IM1 1AA","sofa","tomorrow",{},"err-ferry"),
 (17,"WV1 1AA","TR18 2AA","fridge freezer","tomorrow",{},"trip"),
 (18,"WV1 1AA","WV2 4AA","sofa","today",{},"local-or-cutoff"),
 (19,"WV1 1AA","B1 1AA","sofa",nextwd(5),{},"local"),
 (20,"WV1 1AA","M1 1AE","sofa",nextwd(6),{},"trip"),
 (21,"WV1 1AA","M1 1AE","sofa",nextwd(5),{"flex":True},"trip"),
 (22,"WV1 1AA","B1 1AA","american fridge, corner sofa, 2 wardrobes, 30 boxes, king bed, dining table","tomorrow",{},"local"),
 (23,"WV1 1AA","B1 1AA","3 bed house: 3 beds, 3 wardrobes, 2 sofas, fridge freezer, washing machine, 60 boxes, dining table, 6 chairs, 4 chests of drawers","tomorrow",{},"oversize"),
 (24,"WV1 1AA","B1 1AA","","tomorrow",{},"local"),
 (25,"WV1 1AA","B1 1AA","3 seater sofa, 65 inch tv, 50kg boxes","tomorrow",{},"local"),
 (26,"WV1","B1","sofa","tomorrow",{},"local"),
 (27,"Wolverhampton","Leeds","sofa","tomorrow",{},"trip"),
 (28,"Telford","Walsall","boxes","tomorrow",{},"local"),
 (29,"ZZ99 9ZZ","B1 1AA","sofa","tomorrow",{},"err-locate"),
 (30,"Paris","B1 1AA","sofa","tomorrow",{},"err-locate"),
 (31,"","B1 1AA","sofa","tomorrow",{},"err-input"),
 (32,"WV1 1AA","WV1 1AA","sofa","tomorrow",{},"local"),
 (33,"WV1 1AA","B1 1AA","sofa",d(-2),{},"err-date"),
 (34,"WV1 1AA","B1 1AA","sofa",d(400),{},"local"),
 (35,"WV1 1AA","B1 1AA","sofa","tomorrow",{"phone":"+44 7700 900123"},"local"),
 (36,"WV1 1AA","B1 1AA","sofa","tomorrow",{"phone":"0121 496 0000"},"err-checkout"),
 (37,"WV1 1AA","B1 1AA","sofa","tomorrow",{"phone":"07700"},"err-checkout"),
 (38,"WV1 1AA","B1 1AA","sofa","tomorrow",{"name":""},"err-checkout"),
 (39,"WV1 1AA","B1 1AA","sofa","tomorrow",{"terms":False},"err-checkout"),
 (40,"WV1 1AA","B1 1AA","sofa","tomorrow",{"af":""},"err-checkout"),
 (41,"WV1 1AA","B1 1AA","sofa","tomorrow",{"name":"<img src=x onerror=alert(1)>","notes":"\"><script>alert(2)</script>"},"local"),
 (42,"WV1 1AA","B1 1AA","sofa","tomorrow",{"notes":"Ring bell 🔔 – 3rd floor, no lift. "*40},"local"),
 (43,"WV1 1AA","B1 1AA","sofa","tomorrow",{"helpers":3},"local"),
 (44,"B1 1AA","M1 1AE","sofa","tomorrow",{"helpers":2,"pay":"deposit"},"trip"),
 (45,"WV1 1AA","B1 1AA","sofa","tomorrow",{"mobile":True},"local"),
 (46,"B1 1AA","M1 1AE","sofa","tomorrow",{"mobile":True,"pay":"full"},"trip"),
 (47,"QS","","", "", {"url":"index.html?from=WV1%201AA&to=M1%201AE&items=sofa&helpers=2&date="+d(5)},"trip"),
 (48,"QS","","", "", {"url":"index.html?from=WV1%201AA&to=M1%201AE&items=sofa&helpers=9&date="+d(-3)},"trip"),
 (49,"AREA","","", "", {"url":"areas/telford.html"},"area"),
 (50,"WV1 1AA","B1 1AA","sofa","tomorrow",{"twice":True},"local"),
 (51,"WV1 1AA","WS1 1AA","sofa","tomorrow",{"stale":True,"pay":"deposit"},"trip"),
 (52,"WV1 1AA","B1 1AA","4 bedroom house","tomorrow",{},"oversize"),
 (53,"WV1 1AA","Ryde","sofa","tomorrow",{},"err-ferry"),
 (55,"B1 1AA","M1 1AE","sofa","tomorrow",{"promo":"TEST10","slot":True,"pay":"deposit"},"trip"),
 (56,"WV1 1AA","B1 1AA","sofa","tomorrow",{"promo":"FAKE99"},"local"),
 (57,"WV1 1AA","M1 1AE","sofa","tomorrow",{"via":"ST16 2AA"},"trip"),
 (58,"WV1 1AA","B1 1AA","sofa","tomorrow",{"via":"DY1 1AA"},"local"),
 (59,"WV1 1AA","B1 1AA","sofa","tomorrow",{"via":"ZZ99 9ZZ"},"err-locate"),
 (54,"QS","","","",{"url":"index.html?from=WV1%201AA&to=B1%201AA&items=sofa&date=2020-01-01"},"local"),
]

async def settle(pg):
    try: await pg.wait_for_function("()=>{var e=document.getElementById('qErr');return (e&&!e.hidden)||document.getElementById('sMiles').textContent.trim()!=='\u2013'&&!document.getElementById('goBtn').disabled}", timeout=8000)
    except Exception: pass
    await pg.wait_for_timeout(1400)

async def readp(pg):
    await pg.wait_for_timeout(1300); return await pg.inner_text("#bPrice")

def money(s):
    m = re.findall(r"£\s?([\d,]+(?:\.\d\d)?)", s or ""); return float(m[0].replace(",", "")) if m else None

async def run_one(b, sc):
    sid, f, t, items, when, ex, exp = sc
    vp = {"width": 390, "height": 844} if ex.get("mobile") else {"width": 1366, "height": 900}
    ctx = await b.new_context(viewport=vp); pg = await ctx.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.route("https://api.postcodes.io/**", mock)
    await pg.route(re.compile(r"https://(wa\.me|buy\.stripe\.com|api\.whatsapp).*"), lambda r: asyncio.ensure_future(r.abort()))
    res = {"id": sid, "expect": exp, "issues": []}
    I = res["issues"]
    try:
        if f == "AREA":
            await pg.goto(BASE + ex["url"]); await pg.wait_for_timeout(500)
            frm = pg.locator("form").first
            await pg.fill("form input[name=to]", "WV1 1AA") if await pg.locator("form input[name=to]").count() else None
            await frm.evaluate("f=>f.submit()"); await pg.wait_for_timeout(2500)
            res["url"] = pg.url; res["mode"] = await pg.inner_text("#bMode") if await pg.is_visible("#bMode") else ""
            res["fromVal"] = await pg.input_value("#from")
            if "Telford" not in res["fromVal"]: I.append("area form did not prefill From")
            return res
        if f == "QS":
            await pg.goto(BASE + ex["url"]); await settle(pg)
        else:
            await pg.goto(BASE + "index.html"); await pg.wait_for_timeout(400)
            await pg.fill("#from", f); await pg.fill("#to", t); await pg.fill("#items", items)
            if ex.get("via"): await pg.click("#addStop"); await pg.fill("#via", ex["via"])
            sel = {"today": "wToday", "tomorrow": "wTom"}.get(when, "wPick")
            await pg.evaluate("id=>{var x=document.getElementById(id);x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}))}", sel)
            if sel == "wPick": await pg.evaluate("v=>{var p=document.getElementById('pickDate');p.hidden=false;p.value=v}", when)
            await pg.click("#goBtn"); await settle(pg)
            if ex.get("twice"):
                await pg.fill("#items", "armchair"); await pg.click("#goBtn"); await settle(pg)
        qerr = (await pg.inner_text("#qErr")) if await pg.is_visible("#qErr") else ""
        res["qErr"] = qerr
        if exp == "err-ferry" and "ferry" not in qerr: I.append("ferry job not flagged: " + (qerr or "priced as road trip"))
        if exp.startswith("err-") and exp != "err-checkout":
            if not qerr: I.append("expected a quote error, none shown")
            if await pg.is_visible("#results"): I.append("results visible after error")
            return res
        if qerr: I.append("unexpected quote error: " + qerr); return res
        res["mode"] = await pg.inner_text("#bMode"); res["price"] = await pg.inner_text("#bPrice")
        res["sub"] = await pg.inner_text("#bSub"); res["miles"] = await pg.inner_text("#sMiles")
        res["van"] = await pg.inner_text("#bVan")
        if exp == "oversize":
            if not await pg.is_visible("#oversize"): I.append("oversize load not flagged")
            if await pg.is_visible("#bookBtn"): I.append("book button visible for oversize load")
            return res
        if re.search(r"NaN|undefined|Infinity", res["price"] + res["sub"] + res["miles"]): I.append("NaN/undefined in quote")
        # engine cross-check: lines add up to total
        chk = await pg.evaluate("""()=>{var o=null;try{var C=window.M6_CONFIG;return null}catch(e){return String(e)}}""")
        if ex.get("flex") and await pg.is_enabled("#flex"): await pg.check("#flex"); await pg.wait_for_timeout(200)
        want_h = ex.get("helpers")
        if want_h is not None:
            for _ in range(4): await pg.click("#hMinus")
            for _ in range(want_h): await pg.click("#hPlus")
            await pg.wait_for_timeout(200)
        res["helpers"] = await pg.inner_text("#helpers")
        res["price2"] = await readp(pg)
        if f == "QS":
            res["helpers"] = await pg.inner_text("#helpers")
        if exp.startswith("flag-island"):
            txt = (await pg.inner_text("#results")).lower()
            if not re.search(r"ferry|island|crossing", txt): I.append("island/ferry destination priced as plain road trip (" + res["price"] + ")")
        if exp == "local" and "hour" not in (res["mode"] + res["sub"]).lower() and "/hr" not in res["sub"]: I.append("expected local hourly, got: " + res["mode"])
        if exp == "trip" and not ex.get("stale") and "hour" in res["mode"].lower(): I.append("expected fixed trip, got: " + res["mode"])
        # checkout
        if ex.get("stale"):
            await pg.click("#bookBtn", timeout=5000); await pg.wait_for_timeout(300)
            await pg.fill("#from", "B1 1AA"); await pg.fill("#to", "M1 1AE"); await pg.click("#goBtn"); await settle(pg)
            if await pg.is_visible("#checkout"): I.append("old checkout still open after new price")
            res["price2"] = await readp(pg); res["mode"] = await pg.inner_text("#bMode")
            if "fixed" not in res["mode"].lower(): I.append("re-quote mode wrong: " + res["mode"])
        if f == "QS" and "2020" in ex["url"]:
            if "wasn't available" not in await pg.inner_text("#bWhen"): I.append("bad link date replaced silently")
        await pg.click("#bookBtn", timeout=5000); await pg.wait_for_timeout(500)
        sp = money(await pg.inner_text("#sPrice")); pm0 = money(await pg.inner_text("#bPrice"))
        if sp and pm0 and abs(sp - pm0) > 0.5: I.append("checkout summary £%s != quote £%s" % (sp, pm0))
        o = dict(OK); o.update({k: v for k, v in ex.items() if k in ("name", "phone", "af", "at", "terms", "notes")})
        async def fill_all():
            await pg.fill("#cName", o["name"]); await pg.fill("#cPhone", o["phone"])
            await pg.fill("#cAddrFrom", o["af"]); await pg.fill("#cAddrTo", o["at"])
            if o.get("notes"): await pg.fill("#cNotes", o["notes"])
        if ex.get("mobile"):
            await pg.fill("#cName", o["name"]); await pg.fill("#cPhone", o["phone"])
            for _ in range(3):
                if await pg.is_visible("#cAddrFrom"): await pg.fill("#cAddrFrom", o["af"]); await pg.fill("#cAddrTo", o["at"])
                if await pg.is_visible("#stepNext"): await pg.click("#stepNext"); await pg.wait_for_timeout(300)
        else:
            await fill_all()
        pay = ex.get("pay")
        opts = await pg.eval_on_selector_all('input[name="pay"]', "a=>a.map(x=>x.value)"); res["payOpts"] = opts
        if pay:
            if pay in opts: await pg.evaluate("id=>{var x=document.getElementById(id);x.checked=true;x.dispatchEvent(new Event('change',{bubbles:true}))}", "p_" + pay)
            else: I.append("pay option '%s' missing (have %s)" % (pay, opts))
        if ex.get("slot"):
            if not await pg.is_visible("#cSlot"):
                for _ in range(2):
                    if await pg.is_visible("#stepBack"): await pg.click("#stepBack")
            await pg.select_option("#cSlot", index=2)
        if ex.get("promo"):
            before = money(await pg.inner_text("#sPrice"))
            if not await pg.is_visible("#promoBox"): I.append("promo box hidden")
            await pg.fill("#cPromo", ex["promo"]); await pg.click("#promoBtn"); await pg.wait_for_timeout(400)
            after = money(await pg.inner_text("#sPrice")); res["promoMsg"] = await pg.inner_text("#promoMsg")
            if ex["promo"] == "TEST10" and not (before and after and abs(after - round(before * 0.9)) <= 1): I.append("promo not applied: %s -> %s" % (before, after))
            if ex["promo"] == "FAKE99" and after != before: I.append("invalid promo changed price")
            if ex["promo"] == "FAKE99":
                await pg.click("#coSubmit", force=True); await pg.wait_for_timeout(300)
                if await pg.is_visible("#done"): I.append("booked with an invalid code still typed")
                await pg.fill("#cPromo", "")
            res["price2"] = await pg.inner_text("#sPrice")
        if o["terms"]: await pg.check("#cTerms", force=True)
        amt = await pg.eval_on_selector_all('input[name="pay"]:checked + label .amt', "a=>a.map(x=>x.textContent)")
        res["payAmt"] = amt[0] if amt else ""
        await pg.click("#coSubmit", force=True); await pg.wait_for_timeout(500)
        coerr = (await pg.inner_text("#coErr")) if await pg.is_visible("#coErr") else ""
        res["coErr"] = coerr
        if exp == "err-checkout":
            if not coerr: I.append("bad checkout accepted")
            if await pg.is_visible("#done"): I.append("done screen shown for invalid checkout")
            return res
        if coerr: I.append("unexpected checkout error: " + coerr); return res
        if not await pg.is_visible("#done"): I.append("done screen not shown"); return res
        res["ref"] = await pg.inner_text("#dRef"); res["dline"] = await pg.inner_text("#dLine")
        href = await pg.get_attribute("#dActions a.btn-wa", "href") or ""
        msg = urllib.parse.unquote(href.split("text=", 1)[1]) if "text=" in href else ""
        res["waLen"] = len(href); res["msg"] = msg
        if not re.match(r"^M6-[A-Z0-9]{6}$", res["ref"]): I.append("bad ref " + res["ref"])
        for need in ["BOOKING REQUEST", o["name"] or "", "Collect: ", "Deliver: ", "Agreed to booking terms: yes", "Payment: "]:
            if need and need not in msg: I.append("message missing '%s'" % need[:30])
        pm = money(res["price2"]); dm = money(res["dline"])
        if pm and dm and abs(pm - dm) > 0.5: I.append("price changed between quote £%s and done £%s" % (pm, dm))
        if await pg.locator("img[src=x]").count() or await pg.locator("#cNotes ~ script, #done script").count(): I.append("XSS: markup rendered")
        if len(href) > 4000: I.append("WhatsApp link %d chars (may be cut off)" % len(href))
        if ex.get("via"):
            if ex["via"] not in msg: I.append("stop missing from message")
            if exp == "trip" and "extra stop" not in msg: I.append("stop fee line missing")
        ext = await pg.inner_html("#dExtras")
        if "text/calendar" not in ext: I.append("no calendar link")
        if ex.get("slot") and "time: " not in msg: I.append("time slot missing from message")
        if ex.get("promo") == "TEST10" and "Code TEST10" not in msg: I.append("promo line missing from message")
        if pay == "deposit" and pm:
            dep = money(res["payAmt"]); exp_dep = max(25, round(pm * 0.2))
            if dep is None or abs(dep - exp_dep) > 1: I.append("deposit £%s, expected about £%s" % (dep, exp_dep))
        if errs: I.append("JS errors: " + "; ".join(errs[:2]))
        return res
    except Exception as e:
        I.append("harness exception: " + str(e)[:200]); return res
    finally:
        await ctx.close()

async def extra(b):
    out = []
    ctx = await b.new_context(); pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.route("https://api.postcodes.io/**", mock)
    # engine property checks
    await pg.goto(BASE + "index.html"); await pg.wait_for_timeout(300)
    prop = await pg.evaluate("""()=>{var M=window.M6,C=window.M6_CONFIG,bad=[],d=new Date();d.setDate(d.getDate()+3);
      C.vans.forEach(function(v){var last=0;[2,5,10,25,50,100,200,400,700].forEach(function(mi){[false,true].forEach(function(loc){
        var q=M.price({van:v,miles:mi,vol:2,date:d,helpers:0,flexible:false,local:loc});
        var sum=q.lines.reduce(function(a,l){return a+l.amount},0);
        if(!isFinite(q.total)||q.total<=0)bad.push(v.id+" "+mi+"mi total "+q.total);
        if(Math.abs(sum-q.total)>1)bad.push(v.id+" "+mi+"mi lines "+sum.toFixed(2)+" != total "+q.total);
        if(!loc){if(q.total<last-0.01)bad.push(v.id+" price falls at "+mi+"mi");last=q.total;if(q.total<v.minimum)bad.push(v.id+" below minimum");}
      })})});
      var v=C.vans[0],a=M.price({van:v,miles:80,vol:1,date:d,helpers:0,flexible:false,local:false}),b=M.price({van:v,miles:80,vol:1,date:d,helpers:1,flexible:false,local:false});
      if(b.total<=a.total)bad.push("helper adds nothing on trips");
      var r={};for(var i=0;i<3000;i++){var x=M.ref();if(r[x])bad.push("duplicate ref after "+i);r[x]=1}
      var p=M.readItems("3 seater sofa, 65 inch tv, 50kg boxes, two chairs, a fridge and 12 boxes");
      return {bad:bad,parsed:p.map(function(i){return i.qty+"x "+i.name})}}""")
    out.append(("engine-properties", prop))
    # trade & track & quote desk
    await pg.goto(BASE + "trade.html"); await pg.wait_for_timeout(300)
    await pg.fill("#mdFrom", "WV1 1AA"); await pg.fill("#dp1", "B1 1AA"); await pg.fill("#dw1", "1 sofa")
    await pg.click("#mdSend"); h = await pg.get_attribute("#mdSend", "href")
    out.append(("trade-multidrop", urllib.parse.unquote(h.split("text=")[1])[:160] if "text=" in h else "NO LINK"))
    await pg.goto(BASE + "trade.html"); await pg.click("#mdSend"); out.append(("trade-empty-validation", await pg.inner_text("#mdErr")))
    await pg.goto(BASE + "drive.html"); await pg.click("#dSend"); out.append(("drive-empty", await pg.inner_text("#dErr")))
    await pg.fill("#dName", "Ali"); await pg.fill("#dPhone", "07700900123"); await pg.fill("#dArea", "Telford"); await pg.click("#dSend")
    h = await pg.get_attribute("#dSend", "href"); out.append(("drive-apply", urllib.parse.unquote(h.split("text=")[1]) if "text=" in h else "NO LINK"))
    await pg.goto(BASE + "track.html"); await pg.fill("#tRef", "m6-7kx2pq"); await pg.fill("#tPhone", "07700900123"); await pg.click("#tf button")
    out.append(("track-sample", (await pg.inner_text("#tOut"))[:120]))
    await pg.fill("#tRef", "hello"); await pg.click("#tf button"); out.append(("track-bad-ref", await pg.inner_text("#tErr")))
    await pg.goto(BASE + "quote.html"); await pg.wait_for_timeout(300)
    try:
        await pg.fill("#paste", "Hi can you move a 3 seater sofa and 6 boxes from WV2 4AA to M1 1AE on Friday? thanks")
        await pg.click("#readBtn"); await pg.fill("#cname", "Sam"); await pg.click("#f button[type=submit]"); await pg.wait_for_timeout(1500)
        out.append(("quote-desk", (await pg.evaluate("()=>{var m=document.getElementById('msg');return m.value||m.textContent}"))[:600] + " ERR:" + await pg.inner_text("#err")))
        await pg.fill("#paste", "hiya need a couple of chairs moving from Wolverhampton to Walsall tomorrow please"); await pg.click("#readBtn")
        out.append(("quote-desk-parse", [await pg.input_value("#from"), await pg.input_value("#to"), await pg.input_value("#items"), await pg.input_value("#helpers")]))
        await pg.fill("#to", "BT1 1AA"); await pg.click("#f button[type=submit]"); await pg.wait_for_timeout(800)
        out.append(("quote-desk-ferry", await pg.inner_text("#err")))
    except Exception as e: out.append(("quote-desk", "ERR " + str(e)[:150]))
    out.append(("extra-js-errors", errs))
    await ctx.close(); return out

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        results = []
        for i in range(0, len(S), 5):
            results += await asyncio.gather(*[run_one(b, s) for s in S[i:i+5]])
        ex = await extra(b)
        await b.close()
    json.dump({"scenarios": results, "extra": ex}, open("/tmp/stress50.json", "w"), indent=1, default=str)
    fails = [r for r in results if r["issues"]]
    for r in results:
        print("%2d %-15s %-4s %-28s %s" % (r["id"], r["expect"], "FAIL" if r["issues"] else "ok", (r.get("price2") or r.get("price") or r.get("qErr") or r.get("coErr") or "")[:28].replace("\n"," "), " | ".join(r["issues"])[:220]))
    print("\nPASS %d / %d" % (len(results) - len(fails), len(results)))
    for k, v in ex: print(k, "=>", json.dumps(v)[:400])
asyncio.run(main())
