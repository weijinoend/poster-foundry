(function(){
  'use strict';
  var D = window.MBTI_DATA;
  var TYPES = D.types;
  var TYPE_INDEX = {};
  TYPES.forEach(function(t,i){ TYPE_INDEX[t]=i; });

  var DISCLAIMER = '本文基于线下访谈以及理论书籍创作，仅描述一种现象，但由于个体差异，并无意以偏概全。请大家作为参考娱乐，理性看待。同时，无论什么人格，只要两个人有相互理解的意愿，那就有磨合的机会。但如果任何一个人认为自己绝对正确，那适配度再高都不行。促进交流和理解，消除隔阂，这也是我们学习MBTI，应用荣格八维工具的意义。';
  var DIM_LABEL = { EI:'社交 / 独处', SN:'现实 / 想象', TF:'道理 / 感受', JP:'计划 / 弹性' };
  var DIM_POLES = { EI:['E','I'], SN:['S','N'], TF:['T','F'], JP:['J','P'] };

  var state = { selfType:'', deck:[], answers:[], index:0, result:null, dir:1 };

  /* ---------- 像素形象 ---------- */
  var PALETTE = {
    INTJ:{hair:'#4A3EA8',cloth:'#6C5CE0',accent:'#C9BEFF'},
    INTP:{hair:'#4E5AC0',cloth:'#7488E0',accent:'#CBD6FF'},
    ENTJ:{hair:'#3E2E8C',cloth:'#5B4FC8',accent:'#B9AEFF'},
    ENTP:{hair:'#5A46C8',cloth:'#8B7BD8',accent:'#D8D3FF'},
    INFJ:{hair:'#1F7A60',cloth:'#2E9E7E',accent:'#A8E6D0'},
    INFP:{hair:'#2A8F7A',cloth:'#4FC3A1',accent:'#B8F0DC'},
    ENFJ:{hair:'#1B6B55',cloth:'#26926F',accent:'#9BE0C4'},
    ENFP:{hair:'#35A88A',cloth:'#5FD0AE',accent:'#C7F5E5'},
    ISTJ:{hair:'#235480',cloth:'#3A6FA8',accent:'#A9C9E8'},
    ISFJ:{hair:'#2F6FA8',cloth:'#5B9BD5',accent:'#BBD9F5'},
    ESTJ:{hair:'#1D4A73',cloth:'#2F6690',accent:'#97BBDD'},
    ESFJ:{hair:'#3B7FB8',cloth:'#6FAEE0',accent:'#C9E2F8'},
    ISTP:{hair:'#9C5C0C',cloth:'#C97A16',accent:'#FFDCA0'},
    ISFP:{hair:'#B06A14',cloth:'#E09A2E',accent:'#FFE3B0'},
    ESTP:{hair:'#8A4E08',cloth:'#B86C10',accent:'#FFCF8A'},
    ESFP:{hair:'#C87A1A',cloth:'#F0A93B',accent:'#FFE9C4'}
  };
  var SKIN='#F2C9A0', EYE='#241C2E', SKIN_D='#D9AC84';

  function shade(hex, amount){
    var h = hex.replace('#','');
    var r = Math.round(parseInt(h.slice(0,2),16)*amount);
    var g2 = Math.round(parseInt(h.slice(2,4),16)*amount);
    var b = Math.round(parseInt(h.slice(4,6),16)*amount);
    return '#' + [r,g2,b].map(function(v){
      v = Math.max(0, Math.min(255, v));
      return ('0'+v.toString(16)).slice(-2);
    }).join('');
  }

  function paintSprite(g, type, scale){
    var t = String(type||'').toUpperCase();
    var pal = PALETTE[t] || PALETTE.INTJ;
    var vi = (TYPE_INDEX[t] || 0) % 4;
    var dark = shade(pal.hair, 0.72);
    function px(x,y,w,h,c){ g.fillStyle=c; g.fillRect(x*scale,y*scale,w*scale,h*scale); }
    px(2,11,12,5,pal.cloth);
    px(3,15,10,1,shade(pal.cloth,0.78));
    px(7,11,2,3,pal.accent);
    px(7,10,2,1,SKIN_D);
    px(4,3,8,7,SKIN);
    px(3,1,10,3,pal.hair);
    px(4,1,8,1,dark);
    if (vi === 0){ px(3,4,1,4,pal.hair); px(12,4,1,4,pal.hair); }
    else if (vi === 1){ px(3,4,1,2,pal.hair); px(12,4,1,2,pal.hair); px(4,4,8,1,dark); }
    else if (vi === 2){ px(2,3,1,6,pal.hair); px(13,3,1,6,pal.hair); px(3,4,1,5,pal.hair); px(12,4,1,5,pal.hair); }
    else { px(3,0,10,1,pal.hair); px(3,4,1,3,pal.hair); px(12,4,1,3,pal.hair); }
    px(6,6,1,1,EYE);
    px(9,6,1,1,EYE);
    px(7,8,2,1,SKIN_D);
  }

  function spriteInto(container, type, size, bob){
    var N = 16, scale = Math.max(1, Math.floor((size||96)/N));
    var c = document.createElement('canvas');
    c.width = N*scale; c.height = N*scale;
    if (bob) c.className = 'bob';
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    paintSprite(g, type, scale);
    container.appendChild(c);
    return c;
  }

  /* ---------- 计分 ---------- */
  function buildDeck(){
    return D.questions.map(function(q){
      return { d:q.d, q:q.q, a:q.A, b:q.B, flip: Math.random() < 0.5 };
    });
  }

  function computeResult(){
    var tally = {};
    ['EI','SN','TF','JP'].forEach(function(dim){
      var p = DIM_POLES[dim];
      tally[dim] = {}; tally[dim][p[0]]=0; tally[dim][p[1]]=0;
    });
    state.answers.forEach(function(ans, i){
      if (!ans) return;
      var q = state.deck[i];
      tally[q.d][ans.pole] = (tally[q.d][ans.pole]||0) + 1;
    });
    var letters = '', detail = [];
    ['EI','SN','TF','JP'].forEach(function(dim){
      var p = DIM_POLES[dim];
      var l = tally[dim][p[0]], r = tally[dim][p[1]];
      var win = l >= r ? p[0] : p[1];
      letters += win;
      var winCount = Math.max(l,r), loseCount = Math.min(l,r);
      detail.push({
        dim:dim, label:DIM_LABEL[dim], left:p[0], right:p[1],
        leftCount:l, rightCount:r, win:win,
        close: loseCount >= winCount - 1 && winCount !== 7
      });
    });
    return { type: letters, detail: detail };
  }

  function pairKey(t1,t2){
    return TYPE_INDEX[t1] <= TYPE_INDEX[t2] ? t1+'-'+t2 : t2+'-'+t1;
  }
  function getPair(t1,t2){ return D.pairs[pairKey(t1,t2)] || null; }

  function el(tag, cls, text){
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function reveal(node, i){
    node.classList.add('reveal');
    node.style.animationDelay = (0.05 + (i||0)*0.06) + 's';
    return node;
  }

  function show(id){
    ['screen-cover','screen-quiz','screen-result'].forEach(function(s){
      document.getElementById(s).classList.toggle('hidden', s !== id);
    });
    window.scrollTo(0,0);
  }

  /* ---------- 封面 ---------- */
  function renderCover(){
    var grid = document.getElementById('selfGrid');
    TYPES.forEach(function(t, i){
      var b = document.createElement('button');
      b.className = 'typebtn'; b.type='button';
      b.setAttribute('aria-pressed','false');
      b.dataset.type = t;
      b.style.animation = 'optIn .34s cubic-bezier(.22,.8,.3,1) both';
      b.style.animationDelay = (0.2 + i*0.018) + 's';
      b.innerHTML = '<span>'+t+'</span><span class="mini">'+(D.typeNames[t]||'')+'</span>';
      b.addEventListener('click', function(){
        state.selfType = (state.selfType === t) ? '' : t;
        Array.prototype.forEach.call(grid.children, function(c){
          c.setAttribute('aria-pressed', String(c.dataset.type === state.selfType));
        });
        renderSelfHint();
      });
      grid.appendChild(b);
    });
    document.getElementById('skipSelf').addEventListener('click', function(){
      state.selfType = '';
      Array.prototype.forEach.call(grid.children, function(c){ c.setAttribute('aria-pressed','false'); });
      renderSelfHint(true);
    });
    renderSelfHint();
  }

  function renderSelfHint(skipped){
    var e = document.getElementById('selfHint');
    if (skipped){ e.textContent = '好，那就先跳过。测完 TA 之后还能补上。'; return; }
    if (!state.selfType){ e.textContent = '不选也能测，只是最后算不了匹配度'; return; }
    e.textContent = '已选 ' + state.selfType + ' · ' + (D.typeNames[state.selfType]||'');
  }

  /* ---------- 答题 ---------- */
  // 底部滚动播放：16 型各一个，复制一份做无缝循环
  function renderParade(){
    var host = document.getElementById('qparade');
    if (host.dataset.built) return;
    host.dataset.built = '1';
    var reel = el('div','reel');
    for (var pass = 0; pass < 2; pass++){
      TYPES.forEach(function(t){
        var c = document.createElement('canvas');
        c.width = 160; c.height = 160;
        var g = c.getContext('2d');
        g.imageSmoothingEnabled = false;
        paintSprite(g, t, 10);
        reel.appendChild(c);
      });
    }
    host.appendChild(reel);
  }

  function renderQuiz(dir){
    state.dir = dir || state.dir || 1;
    var q = state.deck[state.index];
    document.getElementById('qcount').textContent = (state.index+1)+' / '+state.deck.length;
    document.getElementById('qdim').textContent = DIM_LABEL[q.d];
    document.getElementById('fill').style.width = (state.index/state.deck.length*100)+'%';
    document.getElementById('qtext').textContent = q.q;

    var left = q.flip ? q.b : q.a;
    var right = q.flip ? q.a : q.b;
    var opts = document.getElementById('opts');
    opts.innerHTML = '';
    [[left,'A'],[right,'B']].forEach(function(pair){
      var opt = pair[0], tag = pair[1];
      var b = document.createElement('button');
      b.className = 'opt'; b.type='button';
      var t = el('span','tag', tag);
      var s = el('span', null, opt[0]);
      b.appendChild(t); b.appendChild(s);
      b.addEventListener('click', function(){
        if (opts.dataset.busy) return;
        opts.dataset.busy = '1';
        b.classList.add('picked');
        state.answers[state.index] = { pole: opt[1], text: opt[0] };
        setTimeout(function(){
          delete opts.dataset.busy;
          if (state.index === state.deck.length-1) finish();
          else { state.index++; renderQuiz(1); }
        }, 150);
      });
      opts.appendChild(b);
    });

    var wrap = document.getElementById('qwrap');
    wrap.classList.remove('in-right','in-left');
    void wrap.offsetWidth;
    wrap.classList.add(state.dir >= 0 ? 'in-right' : 'in-left');

    document.getElementById('prevBtn').classList.toggle('hidden', state.index === 0);
    window.scrollTo(0,0);
  }

  function finish(){
    state.result = computeResult();
    renderResult();
    show('screen-result');
  }

  /* ---------- 结果 ---------- */
  function renderResult(){
    var r = state.result;
    var root = document.getElementById('screen-result');
    root.innerHTML = '';
    root.appendChild(el('div','spacer'));
    root.appendChild(reveal(el('div','kicker','你眼中的 TA'), 0));

    var hero = el('div','hero');
    spriteInto(hero, r.type, 96, true);
    var box = document.createElement('div');
    box.appendChild(el('div','typebig', r.type));
    box.appendChild(el('div','typename', (D.typeNames[r.type]||'')+' · 这是你印象里的 TA'));
    var tt = D.typeText[r.type];
    if (tt && tt.keywords && tt.keywords.length){
      var chips = el('div','chips');
      tt.keywords.forEach(function(k){ chips.appendChild(el('span','chip', k)); });
      box.appendChild(chips);
    }
    hero.appendChild(box);
    root.appendChild(reveal(hero, 1));

    // 四维
    var dimCard = el('div','card');
    dimCard.appendChild(el('div','section-tag','倾向分布'));
    var dims = el('div','dims');
    var bars = [];
    var anyClose = false;
    r.detail.forEach(function(d){
      var row = el('div','dim');
      row.appendChild(el('span','lbl', d.left+' / '+d.right));
      var bar = el('div','bar');
      var total = (d.leftCount + d.rightCount) || 1;
      var li = document.createElement('i'); li.className='l';
      var ri = document.createElement('i'); ri.className='r';
      li.dataset.w = (d.leftCount/total*100);
      ri.dataset.w = (d.rightCount/total*100);
      bar.appendChild(li); bar.appendChild(ri);
      bars.push(li, ri);
      row.appendChild(bar);
      row.appendChild(el('span','val', d.win + (d.close ? ' *' : '')));
      dims.appendChild(row);
      if (d.close) anyClose = true;
    });
    dimCard.appendChild(dims);
    if (anyClose) dimCard.appendChild(el('div','closenote','带 * 的维度两边很接近，TA 可能两头都有。'));
    root.appendChild(reveal(dimCard, 2));

    var seq = 3;

    if (state.selfType){
      root.appendChild(reveal(renderMatch(state.selfType, r.type), seq++));
      root.appendChild(reveal(buildShareCard(
        '你觉得这段关系的描述像吗？',
        '像的话，把它发出去——让 TA 也看看两个人在一起是什么样子。',
        '分享这段关系'
      ), seq++));
    } else {
      root.appendChild(reveal(renderPersonality(r.type), seq++));
      root.appendChild(reveal(buildShareCard(
        '你觉得这些描述和他像吗？',
        '像的话，把这张图发给 TA，让 TA 自己也测一遍，看看准不准。',
        '发给 TA'
      ), seq++));
      root.appendChild(reveal(renderAddSelf(r.type), seq++));
    }

    var dis = el('p','disclaimer', DISCLAIMER);
    root.appendChild(dis);

    var actions = el('div','actions');
    var saveBtn = el('button','btn','生成结果图');
    saveBtn.addEventListener('click', function(){ openShare('长按图片即可保存'); });
    actions.appendChild(saveBtn);
    var again = el('button','btn ghost small','再测一个朋友');
    again.addEventListener('click', function(){
      state.deck = buildDeck();
      state.answers = new Array(state.deck.length).fill(null);
      state.index = 0; state.result = null; state.dir = 1;
      renderQuiz(1); show('screen-quiz');
    });
    actions.appendChild(again);
    root.appendChild(actions);

    window.scrollTo(0,0);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        bars.forEach(function(b){ b.style.width = b.dataset.w + '%'; });
      });
    });
  }

  function renderPersonality(taType){
    var t = D.typeText[taType] || {};
    var card = el('div','card');
    card.appendChild(el('div','section-tag','这个人大概是什么样的人'));
    if (t.lede) card.appendChild(el('p','lede', t.lede));
    (t.blocks || []).forEach(function(b){
      var box = el('div','block');
      box.appendChild(el('div','block-label', b.label));
      box.appendChild(el('p','para', b.text));
      card.appendChild(box);
    });
    return card;
  }

  function renderAddSelf(taType){
    var card = el('div','card tight');
    card.appendChild(el('div','section-tag','想知道你们俩的匹配度？'));
    card.appendChild(el('div','small','补上你自己的类型，就能看到你和 '+taType+' 的匹配度和相处模式。'));
    var grid = el('div','typegrid');
    grid.style.display = 'none';
    var toggle = el('button','btn ghost small','选一下我自己的类型');
    toggle.style.marginTop = '12px';
    toggle.addEventListener('click', function(){ grid.style.display = 'grid'; toggle.remove(); });
    TYPES.forEach(function(t){
      var b = document.createElement('button');
      b.className='typebtn'; b.type='button';
      b.innerHTML = '<span>'+t+'</span><span class="mini">'+(D.typeNames[t]||'')+'</span>';
      b.addEventListener('click', function(){
        state.selfType = t;
        card.parentNode.replaceChild(renderMatch(t, taType), card);
      });
      grid.appendChild(b);
    });
    card.appendChild(toggle);
    card.appendChild(grid);
    return card;
  }

  function buildShareCard(question, hint, btnText){
    var c = el('div','sharecard');
    c.appendChild(el('div','st','分享给 TA'));
    c.appendChild(el('div','q', question));
    c.appendChild(el('div','h', hint));
    var b = el('button','btn small', btnText);
    b.addEventListener('click', function(){ openShare('长按图片保存，然后发给 TA'); });
    c.appendChild(b);
    return c;
  }

  function renderMatch(selfType, taType){
    var pair = getPair(selfType, taType);
    var card = el('div','card');
    if (!pair) return card;

    var mh = el('div','matchhead');
    spriteInto(mh, selfType, 56);
    mh.appendChild(el('div','t','你 '+selfType));
    mh.appendChild(el('div','vs','×'));
    mh.appendChild(el('div','t', taType+' TA'));
    spriteInto(mh, taType, 56);
    card.appendChild(mh);

    card.appendChild(el('div','pairname', pair.n || (selfType+'×'+taType)));
    if (pair.tier) card.appendChild(el('div','pairmeta', pair.tier));

    var sr = el('div','scorerow');
    var num = el('b', null, '0');
    sr.appendChild(num);
    sr.appendChild(el('span', null, '分'));
    card.appendChild(sr);

    var sb = el('div','scorebar');
    var si = document.createElement('i');
    si.dataset.w = pair.s;
    sb.appendChild(si);
    card.appendChild(sb);

    // 分数滚动
    var target = Number(pair.s) || 0;
    var t0 = null;
    function tick(ts){
      if (!t0) t0 = ts;
      var k = Math.min(1, (ts - t0) / 700);
      var eased = 1 - Math.pow(1 - k, 3);
      num.textContent = Math.round(target * eased);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        si.style.width = target + '%';
        requestAnimationFrame(tick);
      });
    });

    if (pair.d) card.appendChild(el('div','desc', pair.d));

    if (pair.a && pair.a.length){
      var s1 = el('div','card dark tight');
      s1.appendChild(el('div','section-tag','你们身上吸引彼此的地方'));
      pair.a.slice(0,4).forEach(function(item){
        var it = el('div','item');
        it.appendChild(el('div','t', item[0]));
        it.appendChild(el('div','d', item[1]));
        s1.appendChild(it);
      });
      card.appendChild(s1);
    }

    if (pair.c && pair.c.length){
      var s2 = el('div','card dark tight');
      s2.appendChild(el('div','section-tag','容易翻车的地方'));
      pair.c.slice(0,3).forEach(function(item){
        var it = el('div','item');
        it.appendChild(el('div','t', item[0]));
        it.appendChild(el('div','d', item[1]));
        s2.appendChild(it);
      });
      card.appendChild(s2);
    }

    if (pair.adv){
      var s3 = el('div','card dark tight advice');
      s3.appendChild(el('div','section-tag','怎么处更顺'));
      [['partner','如果你们是伴侣'],['friend','如果你们是朋友'],['family','如果你们是家人']].forEach(function(x){
        if (!pair.adv[x[0]]) return;
        var row = el('div','row');
        row.appendChild(el('b', null, x[1]));
        row.appendChild(el('p', null, pair.adv[x[0]]));
        s3.appendChild(row);
      });
      card.appendChild(s3);
    }
    return card;
  }

  /* ---------- 结果图 ---------- */
  function openShare(hint){
    if (hint) document.getElementById('shareHint').textContent = hint;
    document.getElementById('shareImg').src = buildShareImage();
    document.getElementById('shareModal').classList.add('on');
  }

  function drawShareSprite(g, type, x, y, boxSize){
    var scale = Math.max(1, Math.floor(boxSize/16));
    g.save(); g.translate(x,y);
    paintSprite(g, type, scale);
    g.restore();
  }

  function roundRect(g,x,y,w,h,r){
    g.beginPath();
    g.moveTo(x+r,y);
    g.arcTo(x+w,y,x+w,y+h,r);
    g.arcTo(x+w,y+h,x,y+h,r);
    g.arcTo(x,y+h,x,y,r);
    g.arcTo(x,y,x+w,y,r);
    g.closePath();
  }

  function wrapText(g, text, cx, y, maxWidth, lineHeight, maxLines){
    var chars = String(text).split('');
    var line = '', lines = [];
    for (var i=0;i<chars.length;i++){
      var test = line + chars[i];
      if (g.measureText(test).width > maxWidth && line){ lines.push(line); line = chars[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    var truncated = lines.length > maxLines;
    if (truncated) lines = lines.slice(0, maxLines);
    lines.forEach(function(l, idx){
      var out = l;
      if (truncated && idx === maxLines-1) out = l.slice(0, Math.max(1,l.length-1)) + '…';
      g.fillText(out, cx, y + idx*lineHeight);
    });
    return y + lines.length*lineHeight;
  }

  // 按宽度切行（只算行，不画）
  function linesFor(g, text, maxWidth){
    var chars = String(text).split('');
    var line = '', lines = [];
    for (var i=0;i<chars.length;i++){
      var t = line + chars[i];
      if (g.measureText(t).width > maxWidth && line){ lines.push(line); line = chars[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  // 空间不够时截到最后一个句号，避免断在半句上
  function clipAtSentence(text, maxChars){
    var head = String(text).slice(0, maxChars);
    var stop = head.lastIndexOf('。');
    if (stop > head.length * 0.5) return head.slice(0, stop + 1);
    return head;
  }

  function buildShareImage(){
    var W = 1080, H = 1920;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    var r = state.result;
    var pair = state.selfType ? getPair(state.selfType, r.type) : null;

    g.fillStyle = '#171320'; g.fillRect(0,0,W,H);
    g.fillStyle = 'rgba(255,106,26,.05)';
    for (var y=0;y<H;y+=48){
      for (var x=((y/48)%2)*24;x<W;x+=48){ g.fillRect(x,y,24,24); }
    }
    g.fillStyle = '#FF6A1A'; g.fillRect(0,0,W,10);

    g.textAlign = 'left';
    g.fillStyle = '#FFB37A'; g.font = '600 26px monospace';
    g.fillText('SHILU · RELATIONSHIP LAB', 72, 120);
    g.fillStyle = '#F4F0FF'; g.font = '700 68px sans-serif';
    g.fillText('你眼中的 TA', 72, 220);

    drawShareSprite(g, r.type, 660, 250, 270);
    if (state.selfType) drawShareSprite(g, state.selfType, 150, 275, 220);

    g.textAlign = 'center';
    g.fillStyle = '#FF6A1A'; g.font = '700 132px monospace';
    g.fillText(r.type, W/2, 690);
    g.fillStyle = '#A79CBF'; g.font = '400 34px sans-serif';
    g.fillText((D.typeNames[r.type]||'')+' · 这是你印象里的 TA', W/2, 744);
    if (state.selfType){
      g.fillStyle = '#7E739A'; g.font = '400 28px sans-serif';
      g.fillText('你 '+state.selfType+' × TA '+r.type, W/2, 794);
    }

    var cur = 880;
    if (pair){
      g.fillStyle = '#2A2338';
      roundRect(g, 72, cur, W-144, 330, 28); g.fill();
      g.fillStyle = '#C9BEFF'; g.font = '600 30px monospace';
      g.fillText(pair.n || (state.selfType+'×'+r.type), W/2, cur+72);
      g.fillStyle = '#FF6A1A'; g.font = '700 120px monospace';
      g.fillText(String(pair.s), W/2-24, cur+210);
      g.fillStyle = '#A79CBF'; g.font = '400 34px sans-serif';
      g.fillText('分', W/2+78, cur+210);
      if (pair.tier){
        g.fillStyle = '#F4F0FF'; g.font = '400 30px sans-serif';
        g.fillText(pair.tier, W/2, cur+278);
      }
      cur += 390;
      if (pair.d){
        g.fillStyle = '#E8E2F7'; g.font = '400 34px sans-serif';
        cur = wrapText(g, pair.d, W/2, cur+20, W-200, 56, 6);
      }
    } else {
      var tt = D.typeText[r.type] || {};
      var LIMIT = 1712;
      var COL_X = 140, COL_W = 800;
      var LINE_H = 38, LABEL_H = 32, BLOCK_GAP = 18;

      // 正文一律左对齐、窄栏，居中排长文最累眼
      g.textAlign = 'left';
      g.fillStyle = '#C9BEFF'; g.font = '600 26px monospace';
      g.fillText('这个人大概是什么样的人', COL_X, 850);

      g.fillStyle = '#F4F0FF'; g.font = '400 34px sans-serif';
      var py = wrapText(g, tt.lede || '', COL_X, 908, COL_W, 50, 3) + 18;

      var blocks = tt.blocks || [];
      for (var bi = 0; bi < blocks.length; bi++){
        var b = blocks[bi];
        var lines = linesFor(g, b.text, COL_W);
        var room = LIMIT - py;

        if (LABEL_H + lines.length * LINE_H > room){
          var maxLines = Math.floor((room - LABEL_H) / LINE_H);
          if (maxLines >= 1){
            g.fillStyle = '#FFB37A'; g.font = '600 24px monospace';
            g.fillText(b.label, COL_X, py + 22);
            g.fillStyle = '#DED7F0'; g.font = '400 24px sans-serif';
            var shown = lines.slice(0, maxLines).join('');
            var perLine = Math.max(1, Math.floor(shown.length / maxLines));
            wrapText(g, clipAtSentence(b.text, perLine * maxLines) + '…',
              COL_X, py + LABEL_H + 22, COL_W, LINE_H, maxLines);
          }
          break;
        }

        g.fillStyle = '#FFB37A'; g.font = '600 24px monospace';
        g.fillText(b.label, COL_X, py + 22);
        g.fillStyle = '#DED7F0'; g.font = '400 24px sans-serif';
        py = wrapText(g, b.text, COL_X, py + LABEL_H + 22, COL_W, LINE_H, lines.length) + BLOCK_GAP;
      }
    }

    g.textAlign = 'center';
    g.fillStyle = '#7E739A'; g.font = '400 26px sans-serif';
    g.fillText('结果只是你视角的印象，不代表 TA 的真实类型', W/2, H-150);
    g.fillStyle = '#FFB37A'; g.font = '600 28px monospace';
    g.fillText('拾陆星人', W/2, H-100);
    return c.toDataURL('image/png');
  }

  /* ---------- 启动 ---------- */
  document.getElementById('closeModal').addEventListener('click', function(){
    document.getElementById('shareModal').classList.remove('on');
  });
  document.getElementById('shareModal').addEventListener('click', function(e){
    if (e.target === this) this.classList.remove('on');
  });
  document.getElementById('prevBtn').addEventListener('click', function(){
    if (state.index > 0){ state.index--; renderQuiz(-1); }
  });
  document.getElementById('startBtn').addEventListener('click', function(){
    state.deck = buildDeck();
    state.answers = new Array(state.deck.length).fill(null);
    state.index = 0; state.dir = 1;
    renderQuiz(1);
    show('screen-quiz');
  });
  renderCover();
  renderParade();
  window.__friendMbti = {
    state: state, computeResult: computeResult, buildShareImage: buildShareImage,
    renderMatch: renderMatch, pairKey: pairKey, getPair: getPair, paintSprite: paintSprite
  };
})();
