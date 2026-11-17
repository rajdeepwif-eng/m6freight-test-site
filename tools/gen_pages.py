import json, re, os
os.chdir('/home/claude/m6-test')
V='?v=20261118h'
def shell(title, body, depth=0, desc="", scripts=True, extra_js=""):
    p='../'*depth
    return f'''<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex, nofollow">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="{p}favicon.svg" type="image/svg+xml">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="{p}styles.css{V}">
</head>
<body>
<div style="background:#ffc20e;color:#101826;text-align:center;font:700 14px/1.4 Arial,sans-serif;padding:6px 10px">TEST SITE: prices are placeholders and bookings here are for testing only.</div>
<header class="top"><div class="wrap"><a class="logo" href="{p}index.html" aria-label="M6 Freight home"><span class="shield">M6</span>FREIGHT</a>
<nav aria-label="Main"><a href="{p}index.html#reasons">Why us</a><a href="{p}trade.html">Trade</a><a href="{p}track.html">Track a job</a><a href="{p}index.html#faq">FAQ</a><a class="call" href="tel:+447301519319">Call 07301 519319</a></nav></div></header>
<main>
{body}
</main>
<footer><div class="wrap"><div><h3>M6 Freight</h3><p>M6 FREIGHTUK LTD, registered in England and Wales. Company no. 17059854.</p></div><div><h3>Contact</h3><p>Phone / WhatsApp: <a href="tel:+447301519319">07301 519319</a></p></div><div><h3>Info</h3><p><a href="{p}index.html">Get a price</a><br><a href="{p}trade.html">Trade accounts</a><br><a href="{p}track.html">Track a job</a><br><a href="{p}guides/man-and-van-prices.html">Prices guide</a><br><a href="{p}terms.html">Booking terms</a> · <a href="{p}privacy.html">Privacy</a></p></div></div></footer>
{f'<script src="{p}config.js{V}"></script>' if scripts else ''}
{extra_js}
</body></html>'''

towns = ["Wolverhampton","Walsall","Dudley","West Bromwich","Birmingham","Telford","Cannock","Stafford","Kidderminster","Bridgnorth"]
notes = {
 "Wolverhampton":"our home base, so we can often collect the same day",
 "Walsall":"a short run up the A454 from our base",
 "Dudley":"across the Black Country, from Sedgley to Brierley Hill",
 "West Bromwich":"including Oldbury, Smethwick and the Sandwell estates",
 "Birmingham":"city flats, student moves in Selly Oak and Edgbaston, and single items",
 "Telford":"from Wellington to Madeley, along the M54",
 "Cannock":"including Hednesford, Heath Hayes and Norton Canes",
 "Stafford":"up the M6 from our base, including Stone and Penkridge",
 "Kidderminster":"and the Wyre Forest villages",
 "Bridgnorth":"High Town, Low Town and the surrounding Shropshire villages"}
for t in towns:
    slug=re.sub(r'[^a-z]+','-',t.lower()).strip('-')
    others=" · ".join(f'<a href="{re.sub(r"[^a-z]+","-",o.lower()).strip("-")}.html">{o}</a>' for o in towns if o!=t)
    body=f'''<section class="hero"><div class="wrap" style="grid-template-columns:1fr">
<div><h1>Man and van<br><em>{t}</em></h1>
<p class="sub">One van, one clear price. Local jobs in {t} are charged by the hour, all-in: <span id="fromRate"></span>. Covering {notes[t]}.</p>
<form class="card" style="margin-top:20px;max-width:620px" action="../index.html" method="get">
<h2>Get my price</h2>
<div class="two"><div class="field"><label for="f">Collect from</label><input id="f" name="from" value="{t}"></div><div class="field"><label for="tt">Deliver to</label><input id="tt" name="to" placeholder="Postcode or town" required></div></div>
<div class="field"><label for="i">What's moving?</label><input id="i" name="items" placeholder="e.g. sofa and 6 boxes"></div>
<button class="btn btn-go" type="submit">Show my price →</button></form></div></div></section>
<section class="band"><div class="wrap" style="display:grid;gap:14px;max-width:900px;margin:0 auto">
<h2>How it works in {t}</h2>
<ol class="steps"><li><b>Get your price</b><span>Type the postcodes and what's moving. No details needed to see a price.</span></li><li><b>Request</b><span>Name, mobile and addresses. Local jobs: no deposit.</span></li><li><b>We confirm</b><span>A real person confirms on WhatsApp.</span></li></ol>
<h2 style="margin-top:20px">Popular jobs in {t}</h2>
<ul class="ticks"><li>Single items: sofas, beds, fridges, Facebook Marketplace collections</li><li>Flat and student moves, with extra hands if you need them</li><li>Trade deliveries for local shops and workshops</li><li>Same-day courier runs across the West Midlands</li></ul>
<p class="small">Other areas: {others}</p></div></section>'''
    js='''<script>(function(){var C=window.M6_CONFIG;var r=Math.min.apply(null,C.vans.map(function(v){return v.hourly}));document.getElementById("fromRate").textContent="from £"+r+"/hr for van and driver, "+C.pricing.minimumHours+"-hour minimum";})();</script>'''
    open(f'areas/{slug}.html','w').write(shell(f"Man and van {t} | M6 Freight", body, 1, f"Man and van in {t}: one van, one clear all-in price. Book in a minute, no account.", True, js))

# Guides
guide_prices='''<section class="band"><div class="wrap" style="max-width:860px;display:grid;gap:14px">
<h1 style="font-size:2.6rem">How much does a man and van cost in the West Midlands?</h1>
<p class="small">Updated November 2026. Market figures come from the sources linked; our own prices are on the <a href="../index.html">price calculator</a>.</p>
<h2>Typical hourly rates</h2>
<div class="tw"><table class="compare"><thead><tr><th>What</th><th>Typical price</th><th>Source</th></tr></thead><tbody>
<tr><td>One person and a van, UK</td><td>£35–£93 an hour (average £64)</td><td><a href="https://www.checkatrade.com/blog/cost-guides/man-van-prices/" rel="noopener">Checkatrade cost guide, May 2026</a></td></tr>
<tr><td>Two people and a van, UK</td><td>£50–£105 an hour (average £78)</td><td><a href="https://www.checkatrade.com/blog/cost-guides/man-van-prices/" rel="noopener">Checkatrade cost guide, May 2026</a></td></tr>
<tr><td>Removals in Wolverhampton (listed firms)</td><td>average about £50 an hour (range £32–£120, checked 18 Nov 2026)</td><td><a href="https://www.hamuch.com/rates/removal-storage/wolverhampton" rel="noopener">HaMuch directory</a></td></tr>
<tr><td>Long trips (100+ miles)</td><td>about £1–£2 a mile</td><td><a href="https://www.homemove.com/content/man-with-a-van-prices" rel="noopener">Homemove guide</a></td></tr>
</tbody></table></div>
<h2>What changes the price</h2>
<ul class="ticks"><li><b>Time:</b> most local jobs have a 2-hour minimum; access, stairs and long carries add time.</li><li><b>People:</b> a second person costs more per hour but often finishes faster.</li><li><b>Van size:</b> bigger vans cost more per hour; picking the right one avoids a second trip.</li><li><b>Distance:</b> long trips are usually priced per mile, including part of the empty drive back.</li><li><b>Day:</b> weekends and same-day bookings usually cost more.</li></ul>
<h2>How we price</h2>
<p>Local jobs: one all-in hourly rate (van, driver, fuel), no booking fee and no stairs fee. Longer trips: one fixed price before you book. <a href="../index.html">See your price in seconds.</a></p>
<h2>Tips to pay less</h2>
<ul class="ticks"><li>Pick a flexible date: we can fit you around trips we're already doing.</li><li>Have everything packed and by the door before we arrive.</li><li>Check parking at both ends; a long carry adds time.</li><li>Dismantle beds and tables before the van arrives.</li></ul>
</div></section>'''
open('guides/man-and-van-prices.html','w').write(shell("Man and van prices West Midlands | M6 Freight", guide_prices, 1, "What a man and van costs in Wolverhampton and the West Midlands in 2026, and how to pay less."))
guide_check='''<section class="band"><div class="wrap" style="max-width:860px;display:grid;gap:14px">
<h1 style="font-size:2.6rem">Moving checklist</h1>
<p>A simple list for a small move or single item. Tick it off as you go (nothing is saved).</p>
<h2>A week before</h2><ul class="cl"><li><label><input type="checkbox"> Book your van and save the WhatsApp confirmation</label></li><li><label><input type="checkbox"> Check parking at both addresses (permits, loading bays)</label></li><li><label><input type="checkbox"> Measure big items and doorways</label></li><li><label><input type="checkbox"> Get boxes, tape and a marker</label></li></ul>
<h2>The day before</h2><ul class="cl"><li><label><input type="checkbox"> Pack and label boxes by room</label></li><li><label><input type="checkbox"> Dismantle beds and tables; bag the screws and tape them on</label></li><li><label><input type="checkbox"> Defrost the freezer and empty the fridge</label></li><li><label><input type="checkbox"> Check your arrival window on WhatsApp</label></li></ul>
<h2>On the day</h2><ul class="cl"><li><label><input type="checkbox"> Keep valuables, documents and chargers with you</label></li><li><label><input type="checkbox"> Clear a path from the door to the van</label></li><li><label><input type="checkbox"> Do a last walk-round: cupboards, loft, garden</label></li><li><label><input type="checkbox"> Check everything has arrived before the van leaves</label></li></ul>
<p><a class="btn btn-go" href="../index.html" style="width:max-content">Get my price</a></p>
</div></section>'''
open('guides/moving-checklist.html','w').write(shell("Moving checklist | M6 Freight", guide_check, 1, "A simple moving checklist for small moves and single items."))
print("pages ok")

trade='''<section class="hero"><div class="wrap">
<div><h1>Trade accounts.<br><em>One message, it's booked.</em></h1>
<p class="sub">For furniture and appliance shops, builders' merchants, estate agents and workshops. Agreed rates, monthly invoice, delivery confirmation on WhatsApp.</p></div>
<div class="ph"><picture><source type="image/webp" srcset="img/business-pallets-800.webp"><img src="img/business-pallets-800.jpg" alt="White van at a loading bay with two pallets" width="800" height="450"></picture></div></div></section>
<section class="band"><div class="wrap" style="display:grid;gap:16px">
<h2 style="margin:0">Account rates</h2>
<p class="small">Standard rates shown. Regular accounts agree their own rates. <span id="rcNote"></span></p>
<div class="tw"><table class="compare"><thead><tr><th>Van</th><th>Fits</th><th>Local, per hour</th><th>Trips, per mile</th><th>Minimum trip</th></tr></thead><tbody id="rateCard"></tbody></table></div>
</div></section>
<section class="band" style="background:#fff"><div class="wrap" style="display:grid;gap:16px;max-width:900px">
<h2 style="margin:0">Multi-drop booking</h2>
<p>Add each drop, then send it to us in one WhatsApp message. We reply with one price for the whole run.</p>
<form id="md" class="panel" novalidate>
<div class="two"><div class="field"><label for="mdCo">Company</label><input id="mdCo" autocomplete="organization"></div><div class="field"><label for="mdDate">Date</label><input id="mdDate" type="date"></div></div>
<div class="field"><label for="mdFrom">Collect from</label><input id="mdFrom" placeholder="Postcode or address"></div>
<div id="drops"></div>
<button type="button" class="btn btn-ghost" id="addDrop" style="width:max-content">+ Add a drop</button>
<div class="field"><label for="mdNotes">Notes (optional)</label><input id="mdNotes" placeholder="Pallets, tail-lift, time windows…"></div>
<p class="err" id="mdErr" hidden></p>
<a class="btn btn-wa" id="mdSend" href="#" target="_blank" rel="noopener">Send run on WhatsApp</a>
</form></div></section>
<section class="band"><div class="wrap" style="display:grid;gap:14px;max-width:900px">
<h2 style="margin:0">Open an account</h2>
<form id="ac" class="panel" novalidate>
<div class="two"><div class="field"><label for="acCo">Company name</label><input id="acCo" autocomplete="organization"></div><div class="field"><label for="acName">Your name</label><input id="acName" autocomplete="name"></div></div>
<div class="two"><div class="field"><label for="acPhone">Mobile</label><input id="acPhone" type="tel" inputmode="tel" autocomplete="tel"></div><div class="field"><label for="acVol">Typical jobs a month</label><select id="acVol"><option>1–4</option><option>5–15</option><option>16–40</option><option>40+</option></select></div></div>
<div class="field"><label for="acWhat">What do you usually send?</label><input id="acWhat" placeholder="e.g. sofas to customers, pallets of tiles"></div>
<a class="btn btn-go" id="acSend" href="#" target="_blank" rel="noopener">Apply on WhatsApp</a>
<p class="small">Accounts are approved after a quick check. Invoice terms are agreed when we open the account.</p>
</form></div></section>'''
trade_js='''<script>(function(){var C=window.M6_CONFIG,co=C.company,P=C.pricing;function $(i){return document.getElementById(i)}function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
$("rateCard").innerHTML=C.vans.map(function(v){return "<tr><td><b>"+esc(v.name)+"</b><br><span class='small'>"+esc(v.example)+"</span></td><td>"+v.capacityM3+" m³</td><td>£"+v.hourly+"</td><td>£"+v.perMile.toFixed(2)+"</td><td>£"+v.minimum+"</td></tr>"}).join("");
$("rcNote").textContent="Extra person £"+P.helperHourly+"/hr local or £"+P.helperTripFee+" per trip. "+(co.vatRegistered?"Prices include VAT.":"Not VAT registered.");
var d=new Date();d.setDate(d.getDate()+1);$("mdDate").value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
var n=0;function addDrop(){n++;var w=document.createElement("div");w.className="two";w.innerHTML='<div class="field"><label for="dp'+n+'">Drop '+n+'</label><input id="dp'+n+'" class="dp" placeholder="Postcode or address"></div><div class="field"><label for="dw'+n+'">What</label><input id="dw'+n+'" class="dw" placeholder="e.g. 1 sofa"></div>';$("drops").appendChild(w);}
addDrop();addDrop();$("addDrop").addEventListener("click",function(){if(n<12)addDrop();});
function wa(t){return "https://wa.me/"+co.phoneIntl+"?text="+encodeURIComponent(t)}
$("mdSend").addEventListener("click",function(e){var ps=[].slice.call(document.querySelectorAll(".dp")),ws=[].slice.call(document.querySelectorAll(".dw"));var lines=[];ps.forEach(function(p,i){if(p.value.trim())lines.push((lines.length+1)+". "+p.value.trim()+(ws[i].value.trim()?" - "+ws[i].value.trim():""));});
if(!$("mdFrom").value.trim()||!lines.length){e.preventDefault();$("mdErr").textContent="Add a collection address and at least one drop.";$("mdErr").hidden=false;return;}
$("mdErr").hidden=true;this.href=wa("TRADE RUN"+($("mdCo").value.trim()?" - "+$("mdCo").value.trim():"")+"\\nDate: "+$("mdDate").value+"\\nCollect: "+$("mdFrom").value.trim()+"\\nDrops:\\n"+lines.join("\\n")+($("mdNotes").value.trim()?"\\nNotes: "+$("mdNotes").value.trim():""));});
$("acSend").addEventListener("click",function(){this.href=wa("TRADE ACCOUNT APPLICATION\\nCompany: "+$("acCo").value+"\\nName: "+$("acName").value+"\\nMobile: "+$("acPhone").value+"\\nJobs a month: "+$("acVol").value+"\\nUsually sends: "+$("acWhat").value);});
})();</script>'''
open('trade.html','w').write(shell("Trade accounts | M6 Freight", trade, 0, "Trade accounts for local businesses: one-message booking, agreed rates, monthly invoice.", True, trade_js))

track='''<section class="band"><div class="wrap" style="max-width:760px;display:grid;gap:16px">
<h1 style="font-size:2.6rem">Track a job</h1>
<form id="tf" class="panel" novalidate>
<div class="two"><div class="field"><label for="tRef">Booking reference</label><input id="tRef" placeholder="M6-XXXXX" autocapitalize="characters" spellcheck="false"></div><div class="field"><label for="tPhone">Mobile used to book</label><input id="tPhone" type="tel" inputmode="tel" placeholder="07…"></div></div>
<p class="err" id="tErr" hidden></p>
<button class="btn btn-go" type="submit">Show status</button>
</form>
<div class="panel" id="tOut" hidden><p id="tHead"></p><ol class="timeline" id="tLine"></ol><p class="small" id="tNote"></p></div>
</div></section>'''
track_js='''<script>(function(){var C=window.M6_CONFIG,co=C.company;function $(i){return document.getElementById(i)}
$("tf").addEventListener("submit",function(e){e.preventDefault();var r=$("tRef").value.trim().toUpperCase(),p=$("tPhone").value.replace(/\\D/g,"");
if(!/^M6-[A-Z0-9]{5,6}$/.test(r)||p.length<10){$("tErr").textContent="Enter your booking reference (like M6-7KX2PQ) and the mobile you booked with.";$("tErr").hidden=false;$("tOut").hidden=true;return;}
$("tErr").hidden=true;
if(!C.demoMode){$("tOut").hidden=false;$("tHead").innerHTML="Live tracking isn't switched on yet. Message us on WhatsApp with <b>"+r+"</b> for an update.";$("tLine").innerHTML="";$("tNote").textContent="";return;}
var steps=[["Request received","Your booking request reached us.",1],["Confirmed","Confirmed on WhatsApp.",1],["Day before","Arrival window 10:00–12:00 sent.",1],["On the way","About 25 minutes away.",2],["Delivered","Photo and sign-off.",0]];
$("tOut").hidden=false;$("tHead").innerHTML="<b>"+r+"</b> <span class='sample'>SAMPLE</span>";
$("tLine").innerHTML=steps.map(function(s,i){return '<li><span class="n" style="background:'+(s[2]==1?"var(--green)":s[2]==2?"var(--blue)":"#c5ccd6")+'">'+(s[2]==1?"✓":i+1)+'</span><span><b>'+s[0]+"</b><br>"+s[1]+"</span></li>"}).join("");
$("tNote").textContent="Test site: this is example progress. The live version would show the real status from the booking log.";});})();</script>'''
open('track.html','w').write(shell("Track a job | M6 Freight", track, 0, "Track your M6 Freight booking.", True, track_js))
print("trade/track ok")

drive='''<section class="hero"><div class="wrap">
<div><h1>Drive with us.<br><em>Overflow work for local vans.</em></h1>
<p class="sub">When we're fully booked we pass jobs to a small group of local van owners we've checked in person. Fixed price per job, agreed before you take it.</p></div>
<div class="ph"><picture><source type="image/webp" srcset="img/hero-motorway-800.webp"><img src="img/hero-motorway-800.jpg" alt="White van on a UK motorway" width="800" height="450"></picture></div></div></section>
<section class="band"><div class="wrap" style="display:grid;gap:16px;max-width:900px">
<h2 style="margin:0">How it works</h2>
<ol class="steps"><li><span><b>Tell us about you</b><br>Your van, areas and when you're free. One WhatsApp message.</span></li>
<li><span><b>We meet and check</b><br>Driving licence, V5C, goods-in-transit and public liability insurance, plus any checks the law requires (such as right to work, where it applies), done before your first job. Please don't send documents through this page.</span></li>
<li><span><b>Get offered jobs</b><br>We send the job, the fixed price and the times. You say yes or no.</span></li>
<li><span><b>Get paid</b><br>Paid by bank transfer within 7 days of the job, against your invoice.</span></li></ol>
<p class="small">You work as an independent business, with your own insurance. Overflow work only: no guaranteed volume. Terms are agreed before your first job.</p>
</div></section>
<section class="band" style="background:#fff"><div class="wrap" style="display:grid;gap:14px;max-width:900px">
<h2 style="margin:0">Apply</h2>
<form id="dv" class="panel" novalidate>
<div class="two"><div class="field"><label for="dName">Your name</label><input id="dName" autocomplete="name"></div><div class="field"><label for="dPhone">Mobile</label><input id="dPhone" type="tel" inputmode="tel" autocomplete="tel"></div></div>
<div class="two"><div class="field"><label for="dVan">Van size</label><select id="dVan"><option>Small van</option><option>Medium (SWB/MWB)</option><option>Large (LWB)</option><option>Luton with tail-lift</option></select></div><div class="field"><label for="dArea">Areas you cover</label><input id="dArea" placeholder="e.g. Wolverhampton, Telford"></div></div>
<div class="field"><label for="dIns">Goods-in-transit and public liability insurance?</label><select id="dIns"><option>Yes, both</option><option>One of them</option><option>Not yet</option></select></div>
<p class="err" id="dErr" role="alert" hidden></p>
<a class="btn btn-wa" id="dSend" href="#" target="_blank" rel="noopener">Apply on WhatsApp</a>
<p class="small">We use these details only to review your application (see our <a href="privacy.html">privacy notice</a>).</p>
</form></div></section>'''
drive_js='''<script>(function(){var co=window.M6_CONFIG.company;function $(i){return document.getElementById(i)}
$("dSend").addEventListener("click",function(e){var n=$("dName").value.trim(),p=$("dPhone").value.replace(/\\(0\\)/g,"").replace(/\\D/g,"");
if(!n||!/^(07\\d{9}|447\\d{9})$/.test(p)){e.preventDefault();$("dErr").textContent="Add your name and UK mobile number.";$("dErr").hidden=false;return;}
$("dErr").hidden=true;this.href="https://wa.me/"+co.phoneIntl+"?text="+encodeURIComponent("DRIVER APPLICATION\\nName: "+n+"\\nMobile: "+$("dPhone").value+"\\nVan: "+$("dVan").value+"\\nAreas: "+$("dArea").value+"\\nInsurance: "+$("dIns").value);});})();</script>'''
open('drive.html','w').write(shell("Drive with us | M6 Freight", drive, 0, "Overflow jobs for checked local van owners.", True, drive_js))
print("drive ok")
