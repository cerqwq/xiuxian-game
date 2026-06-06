/**
 * 鬼谷修仙录 — 前端游戏逻辑
 * 墨雾山水主题
 */

const API = '/xiuxian/api';
let gameState = {
  character: null,
  combat: null,
  selectedElements: [],
  diceStats: null,
  gameData: null,
  combatCombo: 0,
  combatLastHitTime: 0,
};

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initInkCanvas();
  initEventListeners();
  loadGameData();
  tryAutoLoad();
  initAmbientParticles();
});

function initEventListeners() {
  // 角色创建 — 灵根多选
  document.querySelectorAll('.element-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      gameState.selectedElements = Array.from(document.querySelectorAll('.element-btn.active')).map(b => b.dataset.element);
      updateCreationPreview();
      inkSplash(btn, getAccentColor(btn.dataset.element));
    });
  });

  // 骰子按钮
  document.getElementById('btnDice').addEventListener('click', rollDice);

  document.getElementById('btnCreate').addEventListener('click', createCharacter);
  document.getElementById('btnLoad').addEventListener('click', loadCharacter);

  // 游戏操作 — 印章按钮
  document.getElementById('btnCultivate').addEventListener('click', doCultivate);
  document.getElementById('btnExplore').addEventListener('click', doExplore);
  document.getElementById('btnBreakthrough').addEventListener('click', showBreakthrough);
  document.getElementById('btnAscend').addEventListener('click', doAscend);
  document.getElementById('btnInventory').addEventListener('click', showInventory);
  document.getElementById('btnNPC').addEventListener('click', showNPCList);
  document.getElementById('btnQuest').addEventListener('click', showQuests);
  document.getElementById('btnAchievement').addEventListener('click', showAchievements);
  document.getElementById('btnBestiary').addEventListener('click', showBestiary);
  document.getElementById('btnCraft').addEventListener('click', showCrafting);
  document.getElementById('btnMove').addEventListener('click', showMove);
  document.getElementById('btnRest').addEventListener('click', doRest);
  document.getElementById('btnSave').addEventListener('click', saveGame);
  document.getElementById('btnSettings').addEventListener('click', showSettings);
  document.getElementById('btnHelp').addEventListener('click', showHelp);

  // 移动端统计面板
  const mobileToggle = document.getElementById('mobileStatsToggle');
  const mobilePanel = document.getElementById('mobileStatsPanel');
  const mobileOverlay = document.getElementById('mobileStatsOverlay');
  if (mobileToggle && mobilePanel && mobileOverlay) {
    function closeMobileStats() {
      mobilePanel.classList.remove('open');
      mobileOverlay.classList.remove('open');
    }
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobilePanel.classList.contains('open');
      if (isOpen) closeMobileStats();
      else { mobilePanel.classList.add('open'); mobileOverlay.classList.add('open'); }
    });
    mobileOverlay.addEventListener('click', closeMobileStats);
    // 下滑关闭
    let touchStartY = 0;
    mobilePanel.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
    mobilePanel.addEventListener('touchmove', (e) => {
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > 60) closeMobileStats();
    }, { passive: true });
  }

  // 印章按钮墨溅效果
  document.querySelectorAll('.seal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const color = getSealAccentColor(btn);
      inkSplash(btn, color);
    });
  });

  // 印章按钮音效反馈（视觉）
  document.querySelectorAll('.seal-btn').forEach(btn => {
    btn.addEventListener('mousedown', () => {
      btn.style.transition = 'transform 0.08s';
    });
    btn.addEventListener('mouseup', () => {
      btn.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // 忽略输入框内的按键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // 战斗中不响应快捷键
    if (document.getElementById('combatModal').style.display !== 'none') return;
    // 模态框打开时不响应
    if (document.querySelector('.modal.active')) return;

    const key = e.key.toLowerCase();
    const actions = {
      'c': () => document.getElementById('btnCultivate')?.click(),
      'e': () => document.getElementById('btnExplore')?.click(),
      'b': () => document.getElementById('btnBreakthrough')?.click(),
      'i': () => document.getElementById('btnInventory')?.click(),
      'r': () => document.getElementById('btnRest')?.click(),
      's': () => document.getElementById('btnSave')?.click(),
      'h': () => document.getElementById('btnHelp')?.click(),
    };
    if (actions[key]) {
      e.preventDefault();
      actions[key]();
    }
  });
}

function initAmbientParticles() {
  const container = document.getElementById('ambientParticles');
  if (!container) return;
  container.innerHTML = '';

  const types = ['mist', 'gold', 'jade'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = `ambient-particle ${types[i % 3]}`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${6 + Math.random() * 8}s`;
    container.appendChild(p);
  }
}

function getAccentColor(element) {
  const colors = {
    '金': '#a0a0b0', '木': '#5a8a50', '水': '#4a7ab0',
    '火': '#b84030', '土': '#8a7050'
  };
  return colors[element] || '#b8963e';
}

function getSealAccentColor(btn) {
  if (btn.classList.contains('cultivate')) return '#d4b060';
  if (btn.classList.contains('explore')) return '#7ec4b0';
  if (btn.classList.contains('breakthrough')) return '#a07ab0';
  if (btn.classList.contains('inventory')) return '#8a8a98';
  if (btn.classList.contains('npc')) return '#b8963e';
  if (btn.classList.contains('move')) return '#5a9e8f';
  if (btn.classList.contains('rest')) return '#6a6a78';
  return '#b8963e';
}

// 墨溅微交互
function inkSplash(el, color) {
  const rect = el.getBoundingClientRect();
  const splash = document.createElement('div');
  const size = Math.max(rect.width, rect.height) * 1.5;
  splash.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2 - size / 2}px;
    top: ${rect.top + rect.height / 2 - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    background: radial-gradient(circle, ${color}22, ${color}08 40%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
    z-index: 1000;
    animation: inkSplashAnim 0.6s ease-out forwards;
  `;
  document.body.appendChild(splash);
  setTimeout(() => splash.remove(), 600);
}

async function loadGameData() {
  try {
    const res = await fetch(`${API}/game_data`);
    const data = await res.json();
    if (data.success) gameState.gameData = data.data;
  } catch (e) {
    console.error('加载游戏数据失败:', e);
  }
}

async function tryAutoLoad() {
  try {
    const res = await fetch(`${API}/load_character`);
    const data = await res.json();
    if (data.success && data.character) {
      document.getElementById('btnLoad').style.display = 'block';
    }
  } catch (e) {}
}

// ============================================================
// 角色创建
// ============================================================
async function rollDice() {
  const btn = document.getElementById('btnDice');
  btn.disabled = true;
  btn.classList.add('rolling');

  const res = await fetch(`${API}/roll_dice`);
  const data = await res.json();

  if (data.success) {
    const { stats, elements } = data.result;
    gameState.diceStats = stats;

    // 更新属性预览
    document.getElementById('prevGengu').textContent = stats['根骨'];
    document.getElementById('prevWuxing').textContent = stats['悟性'];
    document.getElementById('prevQiyun').textContent = stats['气运'];
    document.getElementById('prevMeili').textContent = stats['魅力'];
    document.getElementById('prevTotal').textContent = Object.values(stats).reduce((a, b) => a + b, 0);

    // 更新灵根选择
    document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('active'));
    gameState.selectedElements = elements;
    elements.forEach(e => {
      const el = document.querySelector(`.element-btn[data-element="${e}"]`);
      if (el) el.classList.add('active');
    });

    // 显示骰子结果
    const diceResult = document.getElementById('diceResult');
    diceResult.textContent = `灵根：${elements.join('·')}  属性：根${stats['根骨']} 悟${stats['悟性']} 气${stats['气运']} 魅${stats['魅力']}`;
    diceResult.classList.add('show');

    updateCreationPreview();
  }

  btn.disabled = false;
  btn.classList.remove('rolling');
}

async function createCharacter() {
  const name = document.getElementById('charName').value.trim();
  if (!name) {
    shakeInput(document.getElementById('charName'));
    return;
  }
  if (gameState.selectedElements.length === 0) {
    addLog('请至少选择一个灵根！', 'danger');
    return;
  }

  const btn = document.getElementById('btnCreate');
  btn.disabled = true;

  const payload = {
    name,
    elements: gameState.selectedElements,
  };
  if (gameState.diceStats) {
    payload.stats = gameState.diceStats;
  }

  const res = await apiPost('/create_character', payload);
  if (res.success) {
    gameState.character = res.character;
    document.querySelector('.creation-scroll').style.animation = 'scrollRoll 0.6s ease-in forwards';
    setTimeout(() => enterGame(), 500);
  } else {
    addLog(res.message, 'danger');
    btn.disabled = false;
  }
}

async function loadCharacter() {
  const res = await fetch(`${API}/load_character`);
  const data = await res.json();
  if (data.success) {
    gameState.character = data.character;
    enterGame();
  }
}

function enterGame() {
  document.getElementById('creationScreen').classList.remove('active');
  const gameScreen = document.getElementById('gameScreen');
  gameScreen.classList.add('active');
  gameScreen.style.animation = 'screenFadeIn 0.8s ease-out';
  updateUI();
  const c = gameState.character;
  const elems = Array.isArray(c.element) ? c.element : [c.element];
  addLog(`${c.name}，欢迎踏入修仙之路。`, 'welcome');
  addLog(`你是一名${elems.join('·')}灵根的练气修士，当前位于${c.location}。`, 'system');

  // 检查挂机修炼收益
  checkIdleCultivation();
}

async function checkIdleCultivation() {
  try {
    const res = await apiPost('/check_idle', { character: gameState.character });
    if (res.success && res.result && res.result.idle_gain > 0) {
      // 后端已修改 character 并保存，用返回的 summary 更新本地状态
      if (res.summary) {
        Object.assign(gameState.character, res.summary);
      }
      updateUI();
      addLog(res.result.message, 'success');
      if (res.result.can_breakthrough) {
        addLog('修为已满，可以尝试突破！', 'success');
      }
    }
  } catch (e) {
    // 静默失败，不影响游戏
  }
}

// ============================================================
// 创建界面预览
// ============================================================
// 五行关系常量（与后端同步）
const ELEMENT_GENERATING = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
const ELEMENT_OVERCOMING = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
const ELEMENT_PASSIVE = {
  '金': { atk_pct: 5 },
  '木': { hp_pct: 5 },
  '水': { mp_pct: 5 },
  '火': { hp_pct: 2.5, atk_pct: 2.5 },
  '土': { def_pct: 5 },
};

function computeElemBonuses(elements) {
  // 五灵根：五行齐聚，全属性+15%
  if (elements.length >= 5) {
    return { hp_pct: 15, mp_pct: 15, atk_pct: 15, def_pct: 15 };
  }
  const total = { hp_pct: 0, mp_pct: 0, atk_pct: 0, def_pct: 0 };
  elements.forEach(elem => {
    const base = { ...ELEMENT_PASSIVE[elem] };
    for (const other of elements) {
      if (other === elem) continue;
      if (ELEMENT_GENERATING[elem] === other) {
        for (const k in base) base[k] *= 2;
        break;
      }
      if (ELEMENT_OVERCOMING[elem] === other) {
        for (const k in base) base[k] *= 0.5;
        break;
      }
    }
    for (const k in total) total[k] += (base[k] || 0);
  });
  return total;
}

function updateCreationPreview() {
  const elems = gameState.selectedElements;
  const bonusList = document.getElementById('elemBonusList');

  if (elems.length === 0) {
    bonusList.innerHTML = '';
    return;
  }

  const bonuses = computeElemBonuses(elems);
  const labels = { hp_pct: '气血', mp_pct: '灵力', atk_pct: '攻击', def_pct: '防御' };
  let html = '';
  for (const [k, v] of Object.entries(bonuses)) {
    if (v > 0) {
      const isEnhanced = v > (ELEMENT_PASSIVE[elems[0]]?.[k] || 5);
      html += `<span class="bonus-tag${isEnhanced ? ' enhanced' : ''}">${labels[k]}+${v}%</span>`;
    }
  }

  // 检查相生/相克关系
  let relations = [];
  for (const e of elems) {
    for (const other of elems) {
      if (e === other) continue;
      if (ELEMENT_GENERATING[e] === other) relations.push(`${e}生${other}`);
      if (ELEMENT_OVERCOMING[e] === other) relations.push(`${e}克${other}`);
    }
  }
  if (relations.length > 0) {
    const hasSheng = relations.some(r => r.includes('生'));
    const hasKe = relations.some(r => r.includes('克'));
    html += `<span class="bonus-relation${hasSheng ? ' sheng' : ''}${hasKe ? ' ke' : ''}">${[...new Set(relations)].join(' ')}</span>`;
  }

  bonusList.innerHTML = html;
}

// ============================================================
// UI 更新
// ============================================================
function updateFromSummary(summary) {
  if (!summary || !gameState.character) return;
  const c = gameState.character;
  c.hp = summary.hp;
  c.max_hp = summary.max_hp;
  c.mp = summary.mp;
  c.max_mp = summary.max_mp;
  c.exp = summary.exp;
  c.exp_to_next = summary.exp_to_next;
  c.lifespan = summary.lifespan;
  c.age = summary.age;
  c.realm = summary.realm_full.replace(/初期|中期|后期|圆满/, '');
  c.attack = summary.attack;
  c.defense = summary.defense;
  if (summary.techniques) c.techniques = summary.techniques;
  if (summary.abilities) c.abilities = summary.abilities;
  if (summary.tech_bonuses) c.tech_bonuses = summary.tech_bonuses;
  if (summary.elem_bonuses) c.elem_bonuses = summary.elem_bonuses;
  if (summary.sword_uses !== undefined) c.sword_uses = summary.sword_uses;
  if (summary.sword_tier !== undefined) c.sword_tier = summary.sword_tier;
  if (summary.skills) c.skills = summary.skills;
  updateUI();
}

function updateUI() {
  const c = gameState.character;
  if (!c) return;

  // 状态栏
  const realmChar = c.realm.charAt(0);
  const realmIcon = document.getElementById('realmIcon');
  realmIcon.textContent = realmChar;
  document.getElementById('realmText').textContent = `${c.realm}${['初期','中期','后期','圆满'][c.stage]}`;

  // 突破提示脉冲
  if (c.exp >= c.exp_to_next) {
    realmIcon.classList.add('pulse');
  } else {
    realmIcon.classList.remove('pulse');
  }

  updateBar('hp', c.hp, c.max_hp);
  updateBar('mp', c.mp, c.max_mp);
  updateBar('exp', c.exp, c.exp_to_next);

  document.getElementById('lifespanValue').textContent = c.lifespan;
  document.getElementById('coinsValue').textContent = c.inventory['灵石'] || 0;
  document.getElementById('ageValue').textContent = `${c.age}岁`;

  // 属性
  document.getElementById('statGengu').textContent = c.stats.根骨;
  document.getElementById('statWuxing').textContent = c.stats.悟性;
  document.getElementById('statQiyun').textContent = c.stats.气运;
  document.getElementById('statMeili').textContent = c.stats.魅力;
  document.getElementById('statAttack').textContent = c.attack;
  document.getElementById('statDefense').textContent = c.defense;

  // 装备
  document.getElementById('equipWeapon').textContent = c.equipped.weapon || '无';
  document.getElementById('equipArmor').textContent = c.equipped.armor || '无';

  // 技能
  const skillList = document.getElementById('skillList');
  skillList.innerHTML = '';
  (c.skills || []).forEach(s => {
    const skillData = gameState.gameData?.skills?.[s];
    const elem = skillData?.element || '金';
    const tag = document.createElement('div');
    tag.className = 'skill-tag' + (skillData?.is_sword ? ' sword-skill' : '');
    tag.dataset.element = elem;
    if (skillData?.is_sword) {
      tag.textContent = `${s} [${skillData.sword_tier}重]`;
      tag.title = `使用次数: ${c.sword_uses || 0}，免费`;
    } else {
      tag.textContent = s;
      tag.title = skillData ? `伤害:${skillData.damage}+${skillData.atk_mult}x攻击 消耗:${skillData.cost}灵力` : '';
    }
    skillList.appendChild(tag);
  });

  // 灵根
  const elems = Array.isArray(c.element) ? c.element : [c.element];
  const elemNames = {'金': '金刚', '木': '长生', '水': '玄水', '火': '烈焰', '土': '厚土'};
  const elemGlyph = document.getElementById('elementGlyph');
  const elemName = document.getElementById('elementName');
  if (elemGlyph) elemGlyph.textContent = elems.length > 1 ? elems.map(e => e).join('') : elems[0];
  if (elemName) elemName.textContent = elems.map(e => elemNames[e] || e).join('·') + '灵根';

  // 功法
  const techList = document.getElementById('techniqueList');
  if (techList) {
    techList.innerHTML = '';
    (c.techniques || []).forEach(t => {
      const techData = gameState.gameData?.techniques?.[t];
      const tag = document.createElement('div');
      tag.className = 'technique-tag';
      tag.dataset.tier = techData?.tier || '黄级';
      tag.title = techData ? `气血+${techData.hp_pct}% 灵力+${techData.mp_pct}% 攻击+${techData.atk_pct}% 防御+${techData.def_pct}%` : '';
      tag.textContent = t;
      techList.appendChild(tag);
    });
    if (!c.techniques || c.techniques.length === 0) {
      techList.innerHTML = '<div class="empty-hint">尚未领悟功法</div>';
    }
  }

  // 神通
  const abilList = document.getElementById('abilityList');
  if (abilList) {
    abilList.innerHTML = '';
    (c.abilities || []).forEach(a => {
      const abilData = gameState.gameData?.abilities?.[a];
      const tag = document.createElement('div');
      tag.className = 'ability-tag';
      tag.dataset.tier = abilData?.tier || '黄级';
      tag.title = abilData ? (abilData.base_damage > 0 ? `伤害:${abilData.base_damage}+${abilData.atk_mult}x攻击 消耗:${abilData.cost}灵力` : `回复:${Math.abs(abilData.base_damage)}生命 消耗:${abilData.cost}灵力`) : '';
      tag.textContent = a;
      abilList.appendChild(tag);
    });
    if (!c.abilities || c.abilities.length === 0) {
      abilList.innerHTML = '<div class="empty-hint">尚未领悟神通</div>';
    }
  }

  // 位置
  document.getElementById('locationName').textContent = c.location;
  const region = gameState.gameData?.regions?.[c.location];
  document.getElementById('locationDesc').textContent = region?.desc || '';

  // 战绩统计
  document.getElementById('statKills').textContent = c.kills || 0;
  document.getElementById('statExplores').textContent = c.stats?.explore_count || 0;
  document.getElementById('statCultivates').textContent = c.stats?.cultivate_count || 0;
  document.getElementById('statAchievements').textContent = (c.achievements || []).length;

  // 地图背景切换
  drawRegionBackground(c.location);

  // 突破按钮
  const btnBT = document.getElementById('btnBreakthrough');
  if (c.exp >= c.exp_to_next) {
    btnBT.style.display = 'flex';
    btnBT.classList.add('pulse');
  } else {
    btnBT.style.display = 'none';
    btnBT.classList.remove('pulse');
  }

  // 飞升按钮（渡劫圆满 + 有渡劫丹 + 修为满）
  const btnAscend = document.getElementById('btnAscend');
  const isDujieMax = c.realm === '渡劫' && c.stage >= 3;
  const hasDujieDan = (c.inventory || {})['渡劫丹'] > 0;
  const expFull = c.exp >= c.exp_to_next;
  if (isDujieMax && hasDujieDan && expFull) {
    btnAscend.style.display = 'flex';
    btnAscend.classList.add('pulse');
  } else {
    btnAscend.style.display = 'none';
    btnAscend.classList.remove('pulse');
  }

  // 移动端统计面板同步
  const mElemName = document.getElementById('mElementName');
  if (mElemName) {
    mElemName.textContent = elems.map(e => elemNames[e] || e).join('·');
    document.getElementById('mStatGengu').textContent = c.stats.根骨;
    document.getElementById('mStatWuxing').textContent = c.stats.悟性;
    document.getElementById('mStatQiyun').textContent = c.stats.气运;
    document.getElementById('mStatMeili').textContent = c.stats.魅力;
    document.getElementById('mStatAttack').textContent = c.attack;
    document.getElementById('mStatDefense').textContent = c.defense;
    document.getElementById('mEquipWeapon').textContent = c.equipped.weapon || '无';
    document.getElementById('mEquipArmor').textContent = c.equipped.armor || '无';
    document.getElementById('mStatKills').textContent = c.kills || 0;
    document.getElementById('mStatExplores').textContent = c.stats?.explore_count || 0;
    document.getElementById('mStatCultivates').textContent = c.stats?.cultivate_count || 0;
    document.getElementById('mStatAchievements').textContent = (c.achievements || []).length;

    const mSkillList = document.getElementById('mSkillList');
    mSkillList.innerHTML = '';
    (c.skills || []).forEach(s => {
      const tag = document.createElement('span');
      tag.className = 'mobile-skill-tag';
      tag.textContent = s;
      mSkillList.appendChild(tag);
    });
    if (!c.skills || c.skills.length === 0) {
      mSkillList.innerHTML = '<span class="empty-hint">暂无技能</span>';
    }
  }
}

function updateBar(type, current, max) {
  const pct = Math.min(100, Math.max(0, (current / max) * 100));
  document.getElementById(`${type}Bar`).style.width = `${pct}%`;
  document.getElementById(`${type}Value`).textContent = `${current}/${max}`;
}

function flashBar(type) {
  const bar = document.getElementById(`${type}Bar`);
  if (!bar) return;
  bar.style.filter = 'brightness(1.8)';
  setTimeout(() => { bar.style.filter = 'brightness(1.3)'; }, 200);
  setTimeout(() => { bar.style.filter = ''; }, 500);
}

// ============================================================
// 游戏操作
// ============================================================
async function doCultivate() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  disableActions(true);
  const cultivateBtn = document.getElementById('btnCultivate');
  cultivateBtn.classList.add('cultivating');

  // 超时保护：15秒后自动恢复按钮
  const safetyTimer = setTimeout(() => {
    cultivateBtn.classList.remove('cultivating');
    disableActions(false);
    console.warn('[cultivate] safety timeout triggered');
  }, 15000);

  try {
    const res = await apiPost('/cultivate', { character: gameState.character });
    if (res.success) {
      addLog(`打坐修炼，感悟天地之道，修为增加 ${res.result.exp_gain}。`, 'success');
      if (res.result.can_breakthrough) {
        addLog('修为已满，可以尝试突破境界！', 'event');
      }
      if (res.result.lifespan_cost) {
        addLog(`岁月流转，寿元减少 ${res.result.lifespan_cost}。`, 'system');
      }
      if (res.summary) updateFromSummary(res.summary);
      // 进度条变化高亮
      flashBar('exp');
      await reloadCharacter();
      checkAchievementsAfterAction();
    } else {
      addLog(res.message || '修炼失败', 'danger');
    }
  } catch (e) {
    console.error('[cultivate]', e);
    addLog('修炼出错', 'danger');
  }

  clearTimeout(safetyTimer);
  cultivateBtn.classList.remove('cultivating');
  disableActions(false);
}

async function doAscend() {
  if (!gameState.character) return;
  const c = gameState.character;

  // 确认对话框
  const confirmed = confirm('飞升仙界？需要消耗一枚渡劫丹，失败将重伤。确定尝试？');
  if (!confirmed) return;

  disableActions(true);
  try {
    const res = await apiPost('/ascend', { character: gameState.character });
    if (res.success) {
      const r = res.result;
      if (r.success) {
        addLog(r.message, 'success');
        addLog(`飞升成功率：${r.rate}%`, 'system');
        // 飞升特效
        triggerAchievementFlash();
        if (typeof playSfx === 'function') playSfx('victory');
      } else {
        addLog(r.message, 'danger');
      }
      if (res.summary) Object.assign(gameState.character, res.summary);
      updateUI();
    } else {
      addLog(res.message || '飞升失败', 'danger');
    }
  } catch (e) {
    console.error('[ascend]', e);
    addLog('飞升出错', 'danger');
  }
  disableActions(false);
}

async function doExplore() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  disableActions(true);

  const safetyTimer = setTimeout(() => disableActions(false), 15000);

  try {
    const res = await apiPost('/explore', { character: gameState.character });
    if (res.success) {
      const r = res.result;
      if (r.type === 'combat') {
        addLog(r.message, 'danger');
        startCombat(r.enemy);
      } else if (r.type === 'event') {
        addLog(r.message, 'event');
        if (r.reward) {
          const items = Object.entries(r.reward).map(([k,v]) => `${k}×${v}`).join('、');
          addLog(`获得：${items}`, 'success');
        }
        if (r.stat_boost) {
          const boosts = Object.entries(r.stat_boost).map(([k,v]) => `${k}+${v}`).join('、');
          addLog(`属性提升：${boosts}`, 'success');
        }
        if (r.technique_found) {
          addLog(`领悟功法：${r.technique_found}`, 'success');
        }
        if (r.ability_found) {
          addLog(`领悟神通：${r.ability_found}`, 'success');
        }
      } else if (r.type === 'npc') {
        addLog(r.message, 'event');
        showNPCDialog(r.npc);
      } else if (r.type === 'chain_start') {
        addLog(r.message, 'event');
        showToast(`探索链开始：${r.chain}`, 'event', 5000);
      } else if (r.type === 'chain') {
        addLog(r.message, 'event');
        if (r.reward) {
          const items = Object.entries(r.reward).map(([k,v]) => `${k}×${v}`).join('、');
          addLog(`获得：${items}`, 'success');
        }
        if (r.stat_boost) {
          const boosts = Object.entries(r.stat_boost).map(([k,v]) => `${k}+${v}`).join('、');
          addLog(`属性提升：${boosts}`, 'success');
        }
        if (r.ability_found) {
          addLog(`领悟神通：${r.ability_found}`, 'success');
        }
      } else {
        addLog(r.message, 'success');
      }
      if (res.summary) updateFromSummary(res.summary);
      await reloadCharacter();
      checkAchievementsAfterAction();
    } else {
      addLog(res.message || '探索失败', 'danger');
    }
  } catch (e) {
    console.error('[explore]', e);
    addLog('探索出错', 'danger');
  }

  clearTimeout(safetyTimer);
  disableActions(false);
}

// ============================================================
// 成就检查
// ============================================================
async function checkAchievementsAfterAction() {
  if (!gameState.character) return;
  try {
    const res = await apiPost('/check_achievements', { character: gameState.character });
    if (res.success && res.new_achievements && res.new_achievements.length > 0) {
      res.new_achievements.forEach(ach => {
        showToast(`成就解锁：${ach}`, 'success', 5000);
        addLog(`成就解锁：${ach}`, 'success');
      });
      // 成就解锁闪光效果
      triggerAchievementFlash();
      if (res.summary) updateFromSummary(res.summary);
      await reloadCharacter();
    }
  } catch (e) {
    // 静默失败，不影响游戏体验
  }
}

async function doExploreChoice(choice) {
  if (!gameState.character) return;
  disableActions(true);

  try {
    const res = await apiPost('/explore_choice', {
      character: gameState.character,
      choice: choice,
    });
    if (res.success) {
      addLog(res.result.message, 'event');
      if (res.result.reward) {
        const items = Object.entries(res.result.reward).map(([k,v]) => `${k}×${v}`).join('、');
        addLog(`获得：${items}`, 'success');
      }
      if (res.result.stat_boost) {
        const boosts = Object.entries(res.result.stat_boost).map(([k,v]) => `${k}+${v}`).join('、');
        addLog(`属性提升：${boosts}`, 'success');
      }
      if (res.summary) updateFromSummary(res.summary);
      await reloadCharacter();
      checkAchievementsAfterAction();
    } else {
      addLog(res.message || '选择失败', 'danger');
    }
  } catch (e) {
    console.error('[explore_choice]', e);
    addLog('选择出错', 'danger');
  }

  disableActions(false);
}

function showBreakthrough() {
  const c = gameState.character;
  if (!c || c.exp < c.exp_to_next) return;

  const modal = document.getElementById('breakthroughModal');
  const info = document.getElementById('breakthroughInfo');
  const itemsDiv = document.getElementById('breakthroughItems');

  info.innerHTML = `
    <div class="current-realm">${c.realm}${['初期','中期','后期','圆满'][c.stage]}</div>
    <div class="success-rate">基础成功率：${getBreakthroughRate(c)}%</div>
  `;

  itemsDiv.innerHTML = '';
  const breakthroughItems = ['筑基丹', '金丹丹', '元婴丹', '化神丹', '破境丹'];
  breakthroughItems.forEach(item => {
    const count = c.inventory[item] || 0;
    if (count > 0) {
      const btn = document.createElement('div');
      btn.className = 'breakthrough-item available';
      btn.textContent = `${item} ×${count}`;
      btn.dataset.item = item;
      btn.addEventListener('click', () => btn.classList.toggle('selected'));
      itemsDiv.appendChild(btn);
    }
  });

  document.getElementById('btnDoBreakthrough').onclick = doBreakthrough;
  modal.classList.add('active');
}

function getBreakthroughRate(c) {
  const rates = { '练气': 80, '筑基': 60, '结丹': 40, '元婴': 25, '化神': 15 };
  return rates[c.realm] || 50;
}

async function doBreakthrough() {
  const selectedItems = [];
  document.querySelectorAll('.breakthrough-item.selected').forEach(el => {
    selectedItems.push(el.dataset.item);
  });

  closeModal('breakthroughModal');
  const res = await apiPost('/breakthrough', {
    character: gameState.character,
    use_items: selectedItems
  });

  if (res.success) {
    const r = res.result;
    if (r.success) {
      addLog(`${r.message}`, 'success');
      playBreakthroughEffect();
    } else {
      addLog(`${r.message}`, 'danger');
    }
    await reloadCharacter();
  }
}

function showInventory() {
  const c = gameState.character;
  if (!c) return;

  const grid = document.getElementById('inventoryGrid');
  grid.innerHTML = '';

  Object.entries(c.inventory).forEach(([name, count]) => {
    if (count <= 0) return;
    const itemData = gameState.gameData?.items?.[name] || {};
    const isEquipped = (c.equipped.weapon === name || c.equipped.armor === name);

    const div = document.createElement('div');
    div.className = `inventory-item${isEquipped ? ' equipped' : ''}`;
    div.innerHTML = `
      <div class="item-name">${name}</div>
      <div class="item-count">×${count}</div>
      <div class="item-desc">${itemData.desc || ''}</div>
    `;
    div.addEventListener('click', () => useItem(name));
    grid.appendChild(div);
  });

  document.getElementById('inventoryModal').classList.add('active');
}

async function useItem(name) {
  const res = await apiPost('/use_item', { character: gameState.character, item: name });
  if (res.success) {
    addLog(res.result.message, res.result.success ? 'success' : 'warning');
    // Use summary for immediate UI feedback
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
    showInventory();
  }
}

// ============================================================
// 帮助系统
// ============================================================
function showHelp() {
  document.getElementById('helpModal').classList.add('active');
}

// ============================================================
// 设置系统
// ============================================================
function showSettings() {
  // 加载保存的设置
  const settings = loadSettings();

  // 设置控件值
  document.getElementById('animSpeed').value = settings.animSpeed;
  document.getElementById('animSpeedValue').textContent = settings.animSpeed + 'x';
  document.getElementById('fontSize').value = settings.fontSize;
  document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';
  document.getElementById('autoSave').checked = settings.autoSave;
  document.getElementById('showTutorial').checked = settings.showTutorial;

  // 添加事件监听器
  document.getElementById('animSpeed').oninput = function() {
    document.getElementById('animSpeedValue').textContent = this.value + 'x';
    saveSettings({ animSpeed: parseFloat(this.value) });
  };

  document.getElementById('fontSize').oninput = function() {
    document.getElementById('fontSizeValue').textContent = this.value + 'px';
    saveSettings({ fontSize: parseInt(this.value) });
    document.documentElement.style.setProperty('--font-size-base', this.value + 'px');
  };

  document.getElementById('autoSave').onchange = function() {
    saveSettings({ autoSave: this.checked });
  };

  document.getElementById('showTutorial').onchange = function() {
    saveSettings({ showTutorial: this.checked });
    if (this.checked) {
      localStorage.removeItem('xiuxian_tutorial_done');
    } else {
      localStorage.setItem('xiuxian_tutorial_done', '1');
    }
  };

  // 存档管理按钮
  document.getElementById('btnExportSave').onclick = exportSave;
  document.getElementById('btnImportSave').onclick = importSave;
  document.getElementById('btnDeleteSave').onclick = deleteSave;
  document.getElementById('btnRebirth').onclick = doRebirth;

  document.getElementById('settingsModal').classList.add('active');
}

function loadSettings() {
  const defaults = {
    animSpeed: 1,
    fontSize: 14,
    autoSave: true,
    showTutorial: true,
  };

  try {
    const saved = localStorage.getItem('xiuxian_settings');
    if (saved) {
      return { ...defaults, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }

  return defaults;
}

function saveSettings(newSettings) {
  try {
    const current = loadSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem('xiuxian_settings', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

function exportSave() {
  if (!gameState.character) {
    showToast('没有存档可导出', 'danger');
    return;
  }

  const saveData = JSON.stringify(gameState.character, null, 2);
  const blob = new Blob([saveData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `xiuxian_save_${gameState.character.name}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('存档已导出', 'success');
}

function importSave() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证存档数据
      if (!data.name || !data.realm) {
        showToast('无效的存档文件', 'danger');
        return;
      }

      // 保存到服务器
      const res = await apiPost('/save_character', { character: data });
      if (res.success) {
        gameState.character = data;
        updateUI();
        showToast('存档已导入', 'success');
        closeModal('settingsModal');
      } else {
        showToast('导入失败: ' + (res.message || '未知错误'), 'danger');
      }
    } catch (err) {
      showToast('导入失败: 文件格式错误', 'danger');
    }
  };

  input.click();
}

async function deleteSave() {
  if (!confirm('确定要删除存档吗？此操作不可撤销！')) {
    return;
  }

  const res = await apiPost('/delete_character', {});
  if (res.success) {
    gameState.character = null;
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('creationScreen').classList.add('active');
    showToast('存档已删除', 'success');
    closeModal('settingsModal');
  } else {
    showToast('删除失败: ' + (res.message || '未知错误'), 'danger');
  }
}

async function doRebirth() {
  const c = gameState.character;
  if (!c) return;

  if (c.realm_level < 2) {
    showToast('需达到筑基期以上方可转世重生！', 'warning');
    return;
  }

  const confirmMsg = `确定要转世重生吗？\n\n将保留：\n- 所有成就 (${(c.achievements || []).length}个)\n- 怪物图鉴\n- NPC关系（减半）\n\n将重置：\n- 境界回到练气初期\n- 技能、功法、神通\n- 背包物品\n\n基于当前进度，预计获得 ${c.realm_level * 10 + (c.achievements || []).length * 3 + Math.floor((c.kills || 0) / 10)} 转世点数。`;

  if (!confirm(confirmMsg)) return;

  const res = await apiPost('/rebirth', { character: c });
  if (res.success) {
    gameState.character = res.character;
    updateUI();
    closeModal('settingsModal');

    const rp = res.result.rebirth_points;
    showToast(`转世重生成功！获得 ${rp} 转世点数`, 'success');

    // 全屏特效
    playBreakthroughEffect('转世重生');

    addLog(`══════ 转世重生 ══════`);
    addLog(`你选择了转世重生，保留前世记忆重新修炼。`);
    addLog(`获得 ${rp} 转世点数，永久提升基础属性。`);
    addLog(`获得 ${rp * 10} 灵石作为启动资金。`);
    addLog(`══════════════════════`);
  } else {
    showToast(res.message || '转世失败', 'danger');
  }
}

// ============================================================
// 任务系统
// ============================================================
function showQuests() {
  const c = gameState.character;
  if (!c) return;

  const region = gameState.gameData?.regions?.[c.location];
  const npcs = region?.npc || [];

  // 获取当前区域NPC的可用任务
  const availableQuests = [];
  npcs.forEach(npcName => {
    const npcQuests = gameState.gameData?.npcs?.[npcName]?.quests || [];
    npcQuests.forEach(quest => {
      const questId = `${npcName}_${quest.name}`;
      const isActive = (c.active_quests || []).some(q => q.id === questId);
      const isCompleted = (c.completed_quests || []).includes(questId);
      if (!isActive && !isCompleted) {
        availableQuests.push({ ...quest, id: questId, npc: npcName });
      }
    });
  });

  const activeQuests = c.active_quests || [];

  const questList = document.getElementById('questList');
  questList.innerHTML = '';

  // 显示进行中的任务
  if (activeQuests.length > 0) {
    const section = document.createElement('div');
    section.className = 'quest-section';
    section.innerHTML = '<h4 class="quest-section-title">进行中</h4>';

    activeQuests.forEach(quest => {
      const div = document.createElement('div');
      div.className = 'quest-item active';
      const progress = quest.progress || 0;
      const count = quest.count || 1;
      const isComplete = progress >= count;

      div.innerHTML = `
        <div class="quest-header">
          <span class="quest-name">${quest.name}</span>
          <span class="quest-npc">${quest.npc}</span>
        </div>
        <div class="quest-desc">${quest.desc}</div>
        <div class="quest-progress">
          <div class="quest-progress-bar">
            <div class="quest-progress-fill" style="width: ${(progress / count) * 100}%"></div>
          </div>
          <span class="quest-progress-text">${progress}/${count}</span>
        </div>
        ${isComplete ? '<button class="quest-complete-btn" data-quest-id="' + quest.id + '">领取奖励</button>' : ''}
      `;

      if (isComplete) {
        const btn = div.querySelector('.quest-complete-btn');
        btn.addEventListener('click', () => completeQuest(quest.id));
      }

      section.appendChild(div);
    });

    questList.appendChild(section);
  }

  // 显示可接取的任务
  if (availableQuests.length > 0) {
    const section = document.createElement('div');
    section.className = 'quest-section';
    section.innerHTML = '<h4 class="quest-section-title">可接取</h4>';

    availableQuests.forEach(quest => {
      const div = document.createElement('div');
      div.className = 'quest-item available';

      let rewardText = '';
      if (quest.reward) {
        rewardText = Object.entries(quest.reward).map(([item, count]) => `${item}×${count}`).join('、');
      }

      div.innerHTML = `
        <div class="quest-header">
          <span class="quest-name">${quest.name}</span>
          <span class="quest-npc">${quest.npc}</span>
        </div>
        <div class="quest-desc">${quest.desc}</div>
        <div class="quest-reward">奖励: ${rewardText}</div>
        <button class="quest-accept-btn" data-quest-id="${quest.id}">接取任务</button>
      `;

      const btn = div.querySelector('.quest-accept-btn');
      btn.addEventListener('click', () => acceptQuestAction(quest.id));

      section.appendChild(div);
    });

    questList.appendChild(section);
  }

  // 没有任务时显示提示
  if (activeQuests.length === 0 && availableQuests.length === 0) {
    questList.innerHTML = '<div class="quest-empty">当前区域没有可用任务。尝试与其他区域的NPC交谈获取任务。</div>';
  }

  // 设置标签切换
  const tabs = document.querySelectorAll('.quest-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // 这里可以添加标签切换逻辑
    });
  });

  document.getElementById('questModal').classList.add('active');
}

async function acceptQuestAction(questId) {
  const res = await apiPost('/accept_quest', { character: gameState.character, quest_id: questId });
  if (res.success) {
    addLog(res.result.message, 'success');
    showToast(res.result.message, 'success');
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
    showQuests();
  } else {
    showToast(res.message || '接取失败', 'danger');
  }
}

async function completeQuest(questId) {
  const res = await apiPost('/complete_quest', { character: gameState.character, quest_id: questId });
  if (res.success) {
    addLog(res.result.message, 'success');
    showToast(res.result.message, 'success');
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
    showQuests();
  } else {
    showToast(res.message || '完成失败', 'danger');
  }
}

// ============================================================
// 成就系统
// ============================================================
function showAchievements() {
  const c = gameState.character;
  if (!c) return;

  // 从服务器获取成就数据
  apiPost('/get_achievements', { character: c }).then(res => {
    if (!res.success) return;

    const grid = document.getElementById('achievementGrid');
    grid.innerHTML = '';

    const achievements = res.achievements || [];
    const completedCount = achievements.filter(a => a.completed).length;

    // 显示成就统计
    const statsDiv = document.createElement('div');
    statsDiv.className = 'achievement-stats';
    statsDiv.innerHTML = `<span>已解锁: ${completedCount}/${achievements.length}</span>`;
    grid.appendChild(statsDiv);

    // 显示成就列表
    achievements.forEach(ach => {
      const div = document.createElement('div');
      div.className = `achievement-item ${ach.completed ? 'completed' : 'locked'}`;

      let rewardText = '';
      if (ach.reward) {
        rewardText = Object.entries(ach.reward).map(([item, count]) => `${item}×${count}`).join('、');
      }

      div.innerHTML = `
        <div class="achievement-icon">${ach.completed ? '成' : '锁'}</div>
        <div class="achievement-info">
          <div class="achievement-name">${ach.id}</div>
          <div class="achievement-desc">${ach.desc}</div>
          <div class="achievement-reward">奖励: ${rewardText}</div>
        </div>
      `;

      grid.appendChild(div);
    });

    document.getElementById('achievementModal').classList.add('active');
  });
}

// ============================================================
// 怪物图鉴
// ============================================================
function showBestiary() {
  const c = gameState.character;
  if (!c) return;

  const encountered = c.stats?.monsters_encountered || [];
  const grid = document.getElementById('bestiaryGrid');
  grid.innerHTML = '';

  // 统计
  const statsDiv = document.createElement('div');
  statsDiv.style.cssText = 'grid-column:1/-1;text-align:center;font-size:13px;color:var(--text-muted);padding:8px 0;font-family:var(--font-display);letter-spacing:2px;';
  statsDiv.textContent = `已收录: ${encountered.length}/${Object.keys(gameState.gameData?.monsters || {}).length}`;
  grid.appendChild(statsDiv);

  // 获取怪物数据
  const monsters = gameState.gameData?.monsters || {};

  // 怪物图标映射
  const monsterIcons = {
    '野狼': '狼', '灵蛇': '蛇', '石傀儡': '傀', '火焰妖': '焰',
    '水鬼': '鬼', '树妖': '树', '雷兽': '雷', '玄冰蛟': '蛟',
    '金甲虫': '虫', '毒蝎': '蝎', '岩魔': '岩', '冰霜巨狼': '狼',
    '幽魂': '魂', '天机傀儡': '机',
    // 新增怪物
    '野猪': '猪', '山贼': '贼', '竹精': '竹', '蜂群': '蜂',
    '熔岩蜥蜴': '蜥', '火鸦': '鸦', '怨灵': '怨', '蛟龙': '龙',
    '机关兽': '兽', '傀儡将军': '将', '五行灵蝶': '蝶', '噬魂蝠王': '蝠',
    '九尾妖狐': '狐', '上古石魔': '魔',
  };

  Object.entries(monsters).forEach(([name, data]) => {
    const isEncountered = encountered.includes(name);
    const div = document.createElement('div');
    div.className = `bestiary-item ${isEncountered ? 'encountered' : 'unknown'}`;

    if (isEncountered) {
      div.innerHTML = `
        <div class="bestiary-icon">${monsterIcons[name] || '怪'}</div>
        <div class="bestiary-info">
          <div class="bestiary-name">${name}<span class="bestiary-element" data-element="${data.element}">${data.element}</span></div>
          <div class="bestiary-stats">
            <span class="bs-item"><span class="bs-label">气血</span>${data.hp}</span>
            <span class="bs-item"><span class="bs-label">攻击</span>${data.damage || data.attack}</span>
            <span class="bs-item"><span class="bs-label">防御</span>${data.defense}</span>
            <span class="bs-item"><span class="bs-label">经验</span>${data.exp}</span>
          </div>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="bestiary-icon">?</div>
        <div class="bestiary-info">
          <div class="bestiary-name">???</div>
          <div class="bestiary-stats"><span class="bs-item">尚未遭遇</span></div>
        </div>
      `;
    }

    grid.appendChild(div);
  });

  document.getElementById('bestiaryModal').classList.add('active');
}

// ============================================================
// 炼丹系统
// ============================================================
function showCrafting() {
  const c = gameState.character;
  if (!c) return;

  apiPost('/get_recipes', { character: c }).then(res => {
    if (!res.success) return;

    const list = document.getElementById('craftList');
    list.innerHTML = '';

    let currentFilter = 'all';

    function renderRecipes(filter) {
      list.innerHTML = '';
      const recipes = res.recipes || [];
      const filtered = filter === 'all' ? recipes : recipes.filter(r => r.type === filter);

      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-hint">暂无可用配方</div>';
        return;
      }

      filtered.forEach(recipe => {
        const div = document.createElement('div');
        div.className = `craft-item ${recipe.can_craft ? 'available' : 'unavailable'}`;

        const typeLabel = {consumable: '丹药', weapon: '法器', armor: '护甲'}[recipe.type] || '物品';

        let materialsHtml = '';
        Object.entries(recipe.materials).forEach(([mat, count]) => {
          const has = (mat === '灵石') ? (c.inventory?.灵石 || 0) >= count : (c.inventory?.[mat] || 0) >= count;
          const current = (mat === '灵石') ? (c.inventory?.灵石 || 0) : (c.inventory?.[mat] || 0);
          materialsHtml += `<span class="craft-material ${has ? 'has' : 'missing'}">${mat} ${current}/${count}</span>`;
        });

        div.innerHTML = `
          <div class="craft-item-header">
            <span class="craft-item-name">${recipe.name}</span>
            <span class="craft-item-type">${typeLabel}</span>
          </div>
          <div class="craft-item-desc">${recipe.desc}</div>
          <div class="craft-materials">${materialsHtml}</div>
          <button class="craft-btn" ${recipe.can_craft ? '' : 'disabled'} onclick="doCraft('${recipe.name}')">
            ${recipe.can_craft ? '炼制' : '材料不足'}
          </button>
        `;

        list.appendChild(div);
      });
    }

    // Tab切换
    document.querySelectorAll('.craft-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.craft-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.tab;
        renderRecipes(currentFilter);
      };
    });

    renderRecipes('all');
    document.getElementById('craftModal').classList.add('active');
  });
}

window.doCraft = async function(recipeName) {
  const c = gameState.character;
  if (!c) return;

  const res = await apiPost('/craft', { character: c, recipe: recipeName });
  if (res.success) {
    gameState.character = { ...c, ...res.summary };
    // 同步完整数据
    const fullRes = await apiPost('/load_character', {});
    if (fullRes.success) gameState.character = fullRes.character;

    updateUI();
    showToast(res.result.message, 'success');
    addLog(res.result.message, 'reward');
    // 重新打开刷新列表
    showCrafting();
  } else {
    showToast(res.message || '炼制失败', 'danger');
  }
}

function showNPCList() {
  const c = gameState.character;
  if (!c) return;

  const region = gameState.gameData?.regions?.[c.location];
  const npcs = region?.npc || [];

  if (npcs.length === 0) {
    addLog('这里没有可以交流的人。', 'system');
    return;
  }

  if (npcs.length === 1) {
    showNPCDialog(npcs[0]);
  } else {
    const modal = document.getElementById('npcModal');
    document.getElementById('npcModalTitle').textContent = '附近的人';
    const dialogue = document.getElementById('npcDialogue');
    const shop = document.getElementById('npcShop');

    dialogue.innerHTML = '';
    shop.innerHTML = '';

    npcs.forEach(npcName => {
      const npcData = gameState.gameData?.npcs?.[npcName];
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <span class="shop-name">${npcName}（${npcData?.title || ''}）</span>
        <span class="shop-price">对话</span>
      `;
      div.addEventListener('click', () => showNPCDialog(npcName));
      shop.appendChild(div);
    });

    modal.classList.add('active');
  }
}

async function showNPCDialog(npcName) {
  const res = await apiPost('/npc', { character: gameState.character, npc: npcName });
  if (!res.success) return;

  const r = res.result;
  const modal = document.getElementById('npcModal');
  document.getElementById('npcModalTitle').textContent = npcName;

  const dialogue = document.getElementById('npcDialogue');
  dialogue.innerHTML = `
    <div class="npc-name">${npcName}（${r.title}）</div>
    <div>"${r.dialogue}"</div>
    <div style="margin-top:8px;font-size:12px;color:var(--text-dim);">好感度：${r.relation}</div>
  `;

  const shop = document.getElementById('npcShop');
  shop.innerHTML = '';

  if (r.shop && r.shop.length > 0) {
    r.shop.forEach(item => {
      const itemData = gameState.gameData?.items?.[item] || {};
      const price = itemData.price || 10;
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <span class="shop-name">${item}（${itemData.desc || ''}）</span>
        <span class="shop-price">灵石 ${price}</span>
      `;
      div.addEventListener('click', () => buyItem(npcName, item));
      shop.appendChild(div);
    });
  }

  // 功法商店
  if (r.technique_shop && r.technique_shop.length > 0) {
    const header = document.createElement('div');
    header.className = 'shop-header';
    header.textContent = '— 功法 —';
    shop.appendChild(header);

    const charElemsTech = Array.isArray(gameState.character?.element) ? gameState.character.element : [gameState.character?.element];
    r.technique_shop.forEach(t => {
      const techData = gameState.gameData?.techniques?.[t] || {};
      const price = techData.price || 0;
      const isLearned = (gameState.character?.techniques || []).includes(t);
      const isLocked = !charElemsTech.includes(techData.element);
      const div = document.createElement('div');
      div.className = `shop-item${isLearned ? ' learned' : ''}${isLocked ? ' locked' : ''}`;
      div.innerHTML = `
        <span class="shop-name">${t}（${techData.desc || ''}）</span>
        <span class="shop-detail">气血+${techData.hp_pct||0}% 灵力+${techData.mp_pct||0}% 攻击+${techData.atk_pct||0}% 防御+${techData.def_pct||0}%</span>
        <span class="shop-price">${isLearned ? '已学会' : isLocked ? `需要${techData.element}灵根` : `灵石 ${price}`}</span>
      `;
      if (!isLearned && !isLocked && price > 0) {
        div.addEventListener('click', () => buyTechnique(npcName, t));
      }
      shop.appendChild(div);
    });
  }

  // 技能商店
  if (r.skill_shop && r.skill_shop.length > 0) {
    const header = document.createElement('div');
    header.className = 'shop-header';
    header.textContent = '— 技能 —';
    shop.appendChild(header);

    const charElems = Array.isArray(gameState.character?.element) ? gameState.character.element : [gameState.character?.element];

    r.skill_shop.forEach(s => {
      const skillData = gameState.gameData?.skills?.[s] || {};
      const price = skillData.price || 0;
      const isLearned = (gameState.character?.skills || []).includes(s);
      const isLocked = !charElems.includes(skillData.element);
      const isSword = skillData.is_sword;
      const dmgDesc = skillData.damage > 0 ? `伤害:${skillData.damage}+${skillData.atk_mult}x` : skillData.damage < 0 ? `回复:${Math.abs(skillData.damage)}生命` : '防御';
      const costDesc = isSword ? '免费(剑法)' : `消耗:${skillData.cost||0}灵力`;
      const div = document.createElement('div');
      div.className = `shop-item${isLearned ? ' learned' : ''}${isLocked ? ' locked' : ''}`;
      div.innerHTML = `
        <span class="shop-name">${s}（${skillData.desc || ''}）</span>
        <span class="shop-detail">${dmgDesc} ${costDesc}</span>
        <span class="shop-price">${isLearned ? '已学会' : isLocked ? `需要${skillData.element}灵根` : price <= 0 ? '免费' : `灵石 ${price}`}</span>
      `;
      if (!isLearned && !isLocked && price > 0) {
        div.addEventListener('click', () => buySkill(npcName, s));
      }
      shop.appendChild(div);
    });
  }

  // 添加交互按钮
  const actions = document.createElement('div');
  actions.className = 'npc-actions';
  actions.innerHTML = `
    <button class="npc-action-btn leave" id="npcLeave">告辞</button>
    <button class="npc-action-btn fight" id="npcFight">切磋</button>
  `;
  shop.appendChild(actions);

  document.getElementById('npcLeave').addEventListener('click', () => {
    closeModal('npcModal');
    addLog(`你与${npcName}告别。`, 'system');
  });

  document.getElementById('npcFight').addEventListener('click', () => {
    closeModal('npcModal');
    startCombat(npcName);
  });

  modal.classList.add('active');
}

async function buyItem(npcName, itemName) {
  const res = await apiPost('/buy', { character: gameState.character, npc: npcName, item: itemName });
  if (res.success) {
    addLog(res.result.message, res.result.success ? 'success' : 'warning');
    await reloadCharacter();
    showNPCDialog(npcName);
  }
}

async function buyTechnique(npcName, techName) {
  const res = await apiPost('/buy_technique', { character: gameState.character, npc: npcName, technique: techName });
  if (res.success) {
    addLog(res.result.message, res.result.success ? 'success' : 'warning');
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
    showNPCDialog(npcName);
  }
}

async function buySkill(npcName, skillName) {
  const res = await apiPost('/buy_skill', { character: gameState.character, npc: npcName, skill: skillName });
  if (res.success) {
    addLog(res.result.message, res.result.success ? 'success' : 'warning');
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
    showNPCDialog(npcName);
  }
}

function showMove() {
  const c = gameState.character;
  if (!c || !gameState.gameData) return;

  const modal = document.getElementById('moveModal');
  const list = document.getElementById('regionList');
  list.innerHTML = '';

  Object.entries(gameState.gameData.regions).forEach(([name, region]) => {
    const isCurrent = c.location === name;
    const realmIndex = ['练气','筑基','结丹','元婴','化神'].indexOf(c.realm);
    const isLocked = realmIndex + 1 < region.level;

    const div = document.createElement('div');
    div.className = `region-card${isCurrent ? ' current' : ''}${isLocked ? ' locked' : ''}`;
    div.innerHTML = `
      <div class="region-name">${name} ${isCurrent ? '（当前位置）' : ''}</div>
      <div class="region-level">需要境界：${['练气','筑基','结丹','元婴','化神'][region.level-1]}</div>
      <div class="region-desc">${region.desc}</div>
    `;

    if (!isCurrent && !isLocked) {
      div.addEventListener('click', () => moveTo(name));
    }

    list.appendChild(div);
  });

  modal.classList.add('active');
}

async function moveTo(region) {
  closeModal('moveModal');
  const res = await apiPost('/move', { character: gameState.character, region });
  if (res.success) {
    if (res.result.success) {
      addLog(res.result.message, 'success');
      await reloadCharacter();
    } else {
      addLog(res.result.message, 'warning');
    }
  }
}

async function doRest() {
  if (!gameState.character) return;
  disableActions(true);

  const safetyTimer = setTimeout(() => disableActions(false), 10000);

  try {
    const res = await apiPost('/rest', { character: gameState.character });
    if (res.success) {
      addLog(res.result.message, 'success');
      if (res.summary) updateFromSummary(res.summary);
      flashBar('hp');
      flashBar('mp');
      await reloadCharacter();
    } else {
      addLog(res.message || '休息失败', 'warning');
    }
  } catch (e) {
    console.error('[rest]', e);
  }

  clearTimeout(safetyTimer);
  disableActions(false);
}

async function saveGame() {
  const res = await apiPost('/save_character', { character: gameState.character });
  if (res.success) {
    addLog('存档成功', 'system');
    showToast('存档成功', 'success');
  } else {
    showToast('存档失败: ' + (res.message || '未知错误'), 'danger');
  }
}

// ============================================================
// 战斗系统
// ============================================================
async function startCombat(enemyName) {
  const res = await apiPost('/combat', { character: gameState.character, enemy: enemyName });
  if (res.success) {
    gameState.combat = res.combat;
    showCombat();
  }
}

// ══════════════════════════════════════════
// 战斗场景星空渲染器
// ══════════════════════════════════════════
const combatStarfield = {
  canvas: null, ctx: null, W: 0, H: 0,
  stars: [], clouds: [], running: false, animId: null, time: 0,

  init() {
    this.canvas = document.getElementById('combatBgCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.createStars();
    this.createClouds();
    this.start();
    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.W = this.canvas.parentElement.clientWidth;
    this.H = this.canvas.parentElement.clientHeight;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  },

  createStars() {
    this.stars = [];
    const W = this.W || 800, H = this.H || 500;
    const layers = [
      { count: 50, rMin: 0.5, rMax: 1.4, speed: 0.6, alphaMin: 0.4, alphaMax: 0.7 },
      { count: 30, rMin: 1.4, rMax: 2.5, speed: 1.0, alphaMin: 0.6, alphaMax: 0.9 },
      { count: 15, rMin: 2.5, rMax: 4.0, speed: 1.6, alphaMin: 0.8, alphaMax: 1.0 },
    ];
    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        const fromRight = Math.random() > 0.5;
        const baseAngle = fromRight ? 2.4 : 0.7;
        const angle = baseAngle + (Math.random() - 0.5) * 0.2;
        const speed = layer.speed + Math.random() * 0.5;
        this.stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: layer.rMin + Math.random() * (layer.rMax - layer.rMin),
          dx: Math.cos(angle) * speed,
          dy: Math.abs(Math.sin(angle)) * speed,
          baseAlpha: layer.alphaMin + Math.random() * (layer.alphaMax - layer.alphaMin),
          twinkleSpeed: 0.8 + Math.random() * 2.5,
          twinklePhase: Math.random() * Math.PI * 2,
          isBright: layer.rMax > 2.5,
          trail: layer.rMax > 2.5,
          fromRight,
        });
      }
    });
  },

  createClouds() {
    this.clouds = [];
    const W = this.W || 800, H = this.H || 500;
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * W * 1.5 - W * 0.25,
        y: H * 0.15 + Math.random() * H * 0.5,
        w: 160 + Math.random() * 250,
        h: 50 + Math.random() * 70,
        dx: 0.1 + Math.random() * 0.15,
        alpha: 0.08 + Math.random() * 0.06,
      });
    }
  },

  start() {
    if (this.running) return;
    this.running = true;
    this.time = 0;
    this.loop();
  },

  stop() {
    this.running = false;
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
  },

  loop() {
    if (!this.running) return;
    this.time += 0.016;
    this.draw();
    this.animId = requestAnimationFrame(() => this.loop());
  },

  draw() {
    const { ctx, W, H, time } = this;
    ctx.clearRect(0, 0, W, H);

    // 云朵（冷青灰色雾气）
    this.clouds.forEach(c => {
      ctx.save();
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.w * 0.5);
      grad.addColorStop(0, `rgba(80, 130, 145, ${c.alpha})`);
      grad.addColorStop(0.5, `rgba(55, 95, 110, ${c.alpha * 0.5})`);
      grad.addColorStop(1, 'rgba(40, 70, 85, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      const grad2 = ctx.createRadialGradient(c.x + c.w * 0.2, c.y - c.h * 0.1, 0, c.x + c.w * 0.2, c.y - c.h * 0.1, c.w * 0.35);
      grad2.addColorStop(0, `rgba(100, 155, 170, ${c.alpha * 0.7})`);
      grad2.addColorStop(1, 'rgba(65, 100, 115, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w * 0.2, c.y - c.h * 0.1, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      const grad3 = ctx.createRadialGradient(c.x - c.w * 0.2, c.y + c.h * 0.1, 0, c.x - c.w * 0.2, c.y + c.h * 0.1, c.w * 0.3);
      grad3.addColorStop(0, `rgba(70, 110, 125, ${c.alpha * 0.6})`);
      grad3.addColorStop(1, 'rgba(45, 80, 95, 0)');
      ctx.fillStyle = grad3;
      ctx.beginPath();
      ctx.ellipse(c.x - c.w * 0.2, c.y + c.h * 0.1, c.w * 0.3, c.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      c.x += c.dx;
      if (c.x > W + c.w) c.x = -c.w;
    });

    // 繁星
    this.stars.forEach(p => {
      const twinkle = Math.sin(time * p.twinkleSpeed + p.twinklePhase) * 0.35 + 0.65;
      const alpha = p.baseAlpha * twinkle;
      ctx.save();

      if (p.trail) {
        const trailLen = p.r * 12;
        const tailX = p.x - p.dx * trailLen;
        const tailY = p.y - p.dy * trailLen;
        const grad = ctx.createLinearGradient(p.x, p.y, tailX, tailY);
        grad.addColorStop(0, `rgba(170, 210, 225, ${alpha * 0.6})`);
        grad.addColorStop(0.4, `rgba(140, 185, 210, ${alpha * 0.2})`);
        grad.addColorStop(1, 'rgba(120, 160, 185, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = p.r * 0.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      if (p.isBright) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 195, 215, ${alpha * 0.12})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190, 220, 240, ${alpha * 0.2})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(190, 220, 240, ${alpha * 0.4})`;
        ctx.lineWidth = 0.8;
        const len = p.r * 6;
        ctx.beginPath();
        ctx.moveTo(p.x - len, p.y); ctx.lineTo(p.x + len, p.y);
        ctx.moveTo(p.x, p.y - len); ctx.lineTo(p.x, p.y + len);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 235, 255, ${alpha})`;
      ctx.fill();
      ctx.restore();

      p.x += p.dx;
      p.y += p.dy;
      if (p.y > H + 10) {
        p.y = -10 - Math.random() * 30;
        p.x = p.fromRight ? W + Math.random() * 50 : -Math.random() * 50;
      }
      if (p.x < -30) p.x = W + 10;
      if (p.x > W + 30) p.x = -10;
    });

    // 绘制角色
    this.drawPlayer();
    this.drawEnemy();
  },

  // ── 角色数据 ──
  playerData: { x: 0, y: 0, elem: '金', weapon: 'sword', breathPhase: 0 },
  enemyData: { x: 0, y: 0, elem: '火', type: 'beast', breathPhase: 0 },
  charParticles: [],

  setPlayer(elem, realm) {
    this.playerData.elem = elem || '金';
    if (realm?.includes('飞升') || realm?.includes('化神')) this.playerData.weapon = 'sword';
    else if (realm?.includes('元婴')) this.playerData.weapon = 'staff';
    else if (realm?.includes('金丹')) this.playerData.weapon = 'blade';
    else this.playerData.weapon = 'sword';
  },

  setEnemy(elem, type) {
    this.enemyData.elem = elem || '火';
    this.enemyData.type = type || 'beast';
  },

  // ── 元素颜色 ──
  elemColors: {
    '金': { primary: '#ffd700', glow: 'rgba(255,215,0,', dark: '#b8963e', light: '#ffe066' },
    '木': { primary: '#5a8a50', glow: 'rgba(90,180,60,', dark: '#3d6b35', light: '#8bc34a' },
    '水': { primary: '#4a90d9', glow: 'rgba(80,160,255,', dark: '#2a6cb0', light: '#80b0e0' },
    '火': { primary: '#e74c3c', glow: 'rgba(255,80,60,', dark: '#a83228', light: '#ff8c6a' },
    '土': { primary: '#a07850', glow: 'rgba(180,140,80,', dark: '#7a5c3a', light: '#c8a870' },
    '无': { primary: '#888', glow: 'rgba(150,150,150,', dark: '#555', light: '#aaa' },
  },

  // ── 绘制玩家（水墨剪影剑客·风动版）──
  drawPlayer() {
    const { ctx, W, H, time } = this;
    const p = this.playerData;
    const c = this.elemColors[p.elem] || this.elemColors['无'];
    const x = W * 0.22;
    const y = H * 0.52;
    const breath = Math.sin(time * 1.2) * 1.5;
    const scale = Math.min(W, H) / 460;
    const windX = Math.sin(time * 0.7) * 3; // 强风偏移

    ctx.save();
    ctx.translate(x, y + breath);
    ctx.scale(scale, scale);

    // ── 脚下光环（冷青灰色调）──
    const rimC = { primary: '#6a8a9a', glow: 'rgba(100,160,180,', dark: '#2a3a40', light: '#90b8c8' };
    this._drawGroundGlow(ctx, 0, 82, 120, 28, rimC, time);

    // ── 大气粒子（雨滴/灰烬/雾气）──
    this._drawAtmosphericParticles(ctx, 0, 0, 130, time);

    // ── 全身黑色剪影底色 ──
    const silColor = 'rgba(8, 12, 18, 0.95)';
    const rimColor = 'rgba(100, 160, 180, 0.35)';
    const rimColorBright = 'rgba(140, 200, 220, 0.6)';

    // ══════════════════════════════════════
    //  飘逸衣摆（先画，被身体覆盖）
    //  图片核心特征：衣摆大幅向左飞扬
    // ══════════════════════════════════════
    ctx.fillStyle = silColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = 'rgba(80, 140, 160, 0.2)';
    ctx.shadowBlur = 6;

    // 长衣摆（从腰下向左大幅飘散，多层）
    const flapWave1 = Math.sin(time * 1.3) * 10;
    const flapWave2 = Math.sin(time * 1.0 + 0.7) * 12;
    const flapWave3 = Math.sin(time * 1.6 + 1.5) * 8;

    // 衣摆层1（最外层，最大）
    ctx.beginPath();
    ctx.moveTo(-10, 38);
    ctx.quadraticCurveTo(-30 + flapWave1, 50, -55 + flapWave2, 42);
    ctx.quadraticCurveTo(-65 + flapWave3, 38, -70 + flapWave1, 48);
    ctx.quadraticCurveTo(-60 + flapWave2, 58, -40 + flapWave3, 55);
    ctx.quadraticCurveTo(-20 + flapWave1, 52, -8, 48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 衣摆层2（中间层）
    ctx.beginPath();
    ctx.moveTo(-8, 42);
    ctx.quadraticCurveTo(-25 + flapWave2, 55, -48 + flapWave3, 50);
    ctx.quadraticCurveTo(-55 + flapWave1, 55, -50 + flapWave2, 62);
    ctx.quadraticCurveTo(-35 + flapWave3, 60, -15 + flapWave1, 55);
    ctx.lineTo(-5, 48);
    ctx.closePath();
    ctx.fill();

    // 衣摆层3（底层，贴身飘）
    ctx.beginPath();
    ctx.moveTo(-5, 46);
    ctx.quadraticCurveTo(-18 + flapWave3, 60, -35 + flapWave1, 58);
    ctx.quadraticCurveTo(-40 + flapWave2, 65, -32 + flapWave3, 68);
    ctx.quadraticCurveTo(-18 + flapWave1, 62, -3, 52);
    ctx.closePath();
    ctx.fill();

    // 腰带飘带（红褐色，大幅飘动）
    ctx.strokeStyle = 'rgba(120, 40, 30, 0.65)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const beltWave1 = Math.sin(time * 1.5) * 10;
    const beltWave2 = Math.sin(time * 1.1 + 1) * 12;
    ctx.beginPath();
    ctx.moveTo(-8, 4);
    ctx.quadraticCurveTo(-25 + beltWave1, 22, -48 + beltWave2, 38);
    ctx.stroke();
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.quadraticCurveTo(-20 + beltWave1 * 0.8, 26, -42 + beltWave2 * 0.9, 42);
    ctx.stroke();
    // 腰带末端分叉
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-48 + beltWave2, 38);
    ctx.quadraticCurveTo(-55 + beltWave1 * 0.6, 42, -52 + beltWave2 * 0.7, 48);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-42 + beltWave2 * 0.9, 42);
    ctx.quadraticCurveTo(-48 + beltWave1 * 0.5, 46, -45 + beltWave2 * 0.8, 50);
    ctx.stroke();
    ctx.lineCap = 'butt';

    // ══════════════════════════════════════
    //  武士刀（最亮光源，先绘制刀刃光晕）
    // ══════════════════════════════════════
    const katanaAngle = -1.05 + Math.sin(time * 1.6) * 0.03;
    const katanaX = 20, katanaY = -52;

    // 刀刃光晕（画面最亮）
    ctx.save();
    ctx.translate(katanaX, katanaY);
    ctx.rotate(katanaAngle);
    const glowIntensity = Math.sin(time * 3) * 0.15 + 0.85;
    ctx.shadowColor = 'rgba(200, 230, 255, 0.9)';
    ctx.shadowBlur = 50 * glowIntensity;
    ctx.fillStyle = 'rgba(200, 230, 255, 0.04)';
    ctx.beginPath();
    ctx.ellipse(0, -45, 25, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ══════════════════════════════════════
    //  腿部（深马步，重心低，宽站姿）
    //  图片：左腿在前弯曲，右腿在后伸展
    // ══════════════════════════════════════
    ctx.fillStyle = silColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = 'rgba(80, 140, 160, 0.3)';
    ctx.shadowBlur = 6;

    // 左腿（前弓步，弯曲）
    ctx.beginPath();
    ctx.moveTo(-22, 40);
    ctx.quadraticCurveTo(-35, 55, -40, 72);
    ctx.quadraticCurveTo(-42, 80, -38, 82);
    ctx.lineTo(-28, 82);
    ctx.quadraticCurveTo(-26, 78, -24, 68);
    ctx.quadraticCurveTo(-18, 52, -12, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 左腿绑腿纹理
    ctx.strokeStyle = 'rgba(100, 160, 180, 0.12)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-38 + i, 70 + i * 3);
      ctx.lineTo(-30 + i, 70 + i * 3);
      ctx.stroke();
    }
    // 左靴
    ctx.fillStyle = silColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-42, 78);
    ctx.quadraticCurveTo(-46, 84, -44, 86);
    ctx.lineTo(-34, 86);
    ctx.quadraticCurveTo(-32, 84, -34, 78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右腿（后伸展，重心低）
    ctx.beginPath();
    ctx.moveTo(8, 40);
    ctx.quadraticCurveTo(18, 58, 26, 76);
    ctx.quadraticCurveTo(30, 82, 26, 84);
    ctx.lineTo(16, 84);
    ctx.quadraticCurveTo(14, 80, 12, 70);
    ctx.quadraticCurveTo(6, 55, 2, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 右腿绑腿纹理
    ctx.strokeStyle = 'rgba(100, 160, 180, 0.12)';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(16 + i, 72 + i * 3);
      ctx.lineTo(24 + i, 72 + i * 3);
      ctx.stroke();
    }
    // 右靴
    ctx.fillStyle = silColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(24, 80);
    ctx.quadraticCurveTo(30, 86, 28, 88);
    ctx.lineTo(18, 88);
    ctx.quadraticCurveTo(14, 86, 16, 80);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ══════════════════════════════════════
    //  身体（交领右衽宽袖长衫，低重心）
    // ══════════════════════════════════════
    ctx.fillStyle = silColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;

    // 主袍身（从肩膀到腰）
    ctx.beginPath();
    ctx.moveTo(-24, -28);
    ctx.quadraticCurveTo(-30, 0, -28, 38);
    ctx.quadraticCurveTo(-22, 48, -8, 48);
    ctx.lineTo(8, 48);
    ctx.quadraticCurveTo(22, 48, 28, 38);
    ctx.quadraticCurveTo(30, 0, 24, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 衣纹（交领右衽线条）
    ctx.strokeStyle = 'rgba(100, 160, 180, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.lineTo(2, -16);
    ctx.lineTo(14, -26);
    ctx.stroke();
    // 襟线
    ctx.beginPath();
    ctx.moveTo(2, -16);
    ctx.lineTo(0, 8);
    ctx.stroke();
    // 袍纹
    ctx.beginPath();
    ctx.moveTo(-18, 6);
    ctx.quadraticCurveTo(0, 18, 18, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20, 22);
    ctx.quadraticCurveTo(0, 36, 20, 22);
    ctx.stroke();

    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.5;

    // ══════════════════════════════════════
    //  腰带（红褐色布质腰带）
    // ══════════════════════════════════════
    ctx.fillStyle = 'rgba(120, 40, 30, 0.85)';
    ctx.shadowColor = 'rgba(180, 60, 40, 0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-24, -2);
    ctx.quadraticCurveTo(0, 2, 24, -2);
    ctx.quadraticCurveTo(0, 8, -24, -2);
    ctx.fill();

    // 腰带结
    ctx.fillStyle = 'rgba(140, 50, 35, 0.9)';
    ctx.beginPath();
    ctx.ellipse(-4, 2, 7, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = silColor;
    ctx.shadowBlur = 8;

    // ══════════════════════════════════════
    //  左袖（宽袖，左手握刀鞘附近）
    // ══════════════════════════════════════
    ctx.fillStyle = silColor;
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.4;
    ctx.shadowColor = 'rgba(80, 140, 160, 0.3)';
    ctx.shadowBlur = 8;

    const lSleeveWave = Math.sin(time * 1.8) * 5;
    ctx.beginPath();
    ctx.moveTo(-24, -24);
    ctx.quadraticCurveTo(-38, -6, -42 + lSleeveWave, 14);
    ctx.quadraticCurveTo(-40, 24, -30, 20);
    ctx.lineTo(-24, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 左手（握拳，在刀鞘位置）
    ctx.beginPath();
    ctx.ellipse(-34 + lSleeveWave * 0.3, 10, 5, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // ══════════════════════════════════════
    //  右袖（宽袖，持刀手臂高举）
    // ══════════════════════════════════════
    const rSleeveWave = Math.sin(time * 2.2) * 4;
    ctx.beginPath();
    ctx.moveTo(24, -24);
    ctx.quadraticCurveTo(34, -40, 30 + rSleeveWave, -52);
    ctx.quadraticCurveTo(26, -56, 20, -48);
    ctx.lineTo(22, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 袖口飘动细节
    ctx.beginPath();
    ctx.moveTo(30 + rSleeveWave, -52);
    ctx.quadraticCurveTo(36 + rSleeveWave * 0.5, -49, 32 + rSleeveWave, -46);
    ctx.strokeStyle = 'rgba(100, 160, 180, 0.15)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 1.4;

    // ══════════════════════════════════════
    //  头部（剪影 + 斗笠）
    // ══════════════════════════════════════
    // 头部（圆润剪影，无五官）
    ctx.fillStyle = silColor;
    ctx.shadowColor = 'rgba(80, 140, 160, 0.3)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, -48, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── 斗笠（更宽大的竹笠，顶部小凸起）──
    ctx.fillStyle = 'rgba(12, 16, 22, 0.95)';
    ctx.strokeStyle = rimColorBright;
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 15;

    // 斗笠主体（锥形，顶部有小凸起）
    ctx.beginPath();
    ctx.moveTo(0, -82);
    ctx.quadraticCurveTo(2, -80, 3, -78); // 顶部小凸起
    ctx.quadraticCurveTo(-8, -68, -10, -62);
    ctx.lineTo(10, -62);
    ctx.quadraticCurveTo(8, -68, 3, -78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 斗笠宽檐（非常宽大，椭圆形边缘）
    ctx.beginPath();
    ctx.ellipse(0, -62, 38, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 斗笠编织纹理
    ctx.strokeStyle = 'rgba(100, 160, 180, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = -30; i <= 30; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, -66);
      ctx.quadraticCurveTo(i * 0.3, -62, i, -58);
      ctx.stroke();
    }
    // 横向编织纹
    ctx.beginPath();
    ctx.ellipse(0, -62, 28, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, -62, 18, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    // ── 长发（斗笠下方飘散，大幅向左飞扬）──
    ctx.fillStyle = 'rgba(5, 8, 14, 0.9)';
    ctx.strokeStyle = 'rgba(100, 160, 180, 0.2)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 8;

    const hairWave1 = Math.sin(time * 1.8) * 12;
    const hairWave2 = Math.sin(time * 1.4 + 0.5) * 10;

    // 发丝束1（主飘发，最长）
    ctx.beginPath();
    ctx.moveTo(-8, -54);
    ctx.quadraticCurveTo(-22 + hairWave1, -44, -42 + hairWave2, -32);
    ctx.quadraticCurveTo(-55 + hairWave1 * 0.7, -22, -65 + hairWave2, -12);
    ctx.quadraticCurveTo(-62 + hairWave1 * 0.5, -16, -52 + hairWave2 * 0.8, -26);
    ctx.quadraticCurveTo(-35 + hairWave1 * 0.3, -38, -12, -50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 发丝束2
    ctx.beginPath();
    ctx.moveTo(-6, -52);
    ctx.quadraticCurveTo(-18 + hairWave2, -40, -35 + hairWave1, -28);
    ctx.quadraticCurveTo(-45 + hairWave2 * 0.6, -18, -55 + hairWave1 * 0.8, -8);
    ctx.quadraticCurveTo(-50 + hairWave2 * 0.4, -12, -40 + hairWave1 * 0.5, -24);
    ctx.quadraticCurveTo(-22 + hairWave2 * 0.3, -36, -8, -48);
    ctx.closePath();
    ctx.fill();

    // 发丝束3（细节飘丝）
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-10, -52);
    ctx.quadraticCurveTo(-28 + hairWave1 * 0.6, -38, -50 + hairWave2, -22);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, -53);
    ctx.quadraticCurveTo(-22 + hairWave2 * 0.5, -36, -42 + hairWave1 * 0.7, -18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, -51);
    ctx.quadraticCurveTo(-25 + hairWave1 * 0.4, -34, -45 + hairWave2 * 0.8, -14);
    ctx.stroke();

    // ══════════════════════════════════════
    //  武士刀（katana，右手高举至右肩上方）
    // ══════════════════════════════════════
    ctx.save();
    ctx.translate(katanaX, katanaY);
    ctx.rotate(katanaAngle);

    // 刀身（冷白色荧光，画面最亮光源）
    const bladeGrad = ctx.createLinearGradient(0, -75, 0, 10);
    bladeGrad.addColorStop(0, 'rgba(230, 245, 255, 0.95)');
    bladeGrad.addColorStop(0.3, 'rgba(200, 225, 245, 0.9)');
    bladeGrad.addColorStop(0.7, 'rgba(170, 200, 230, 0.8)');
    bladeGrad.addColorStop(1, 'rgba(140, 170, 200, 0.6)');
    ctx.fillStyle = bladeGrad;
    ctx.shadowColor = 'rgba(200, 230, 255, 0.9)';
    ctx.shadowBlur = 35 * glowIntensity;

    // 刀身形状（微弧，武士刀特征）
    ctx.beginPath();
    ctx.moveTo(-1.5, 5);
    ctx.lineTo(1.5, 5);
    ctx.quadraticCurveTo(2, -25, 1.2, -50);
    ctx.lineTo(0, -72); // 刀尖
    ctx.lineTo(-1.2, -50);
    ctx.quadraticCurveTo(-2, -25, -1.5, 5);
    ctx.fill();

    // 刀刃反光线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.5;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(0, -69);
    ctx.quadraticCurveTo(0.5, -30, 0, 3);
    ctx.stroke();

    // 刃纹（波浪形刃文）
    ctx.strokeStyle = 'rgba(180, 210, 240, 0.3)';
    ctx.lineWidth = 0.4;
    ctx.shadowBlur = 0;
    for (let i = -65; i < 0; i += 8) {
      ctx.beginPath();
      ctx.moveTo(-0.8, i);
      ctx.quadraticCurveTo(0, i + 4, 0.8, i);
      ctx.stroke();
    }

    // 刀镡（护手）
    ctx.fillStyle = 'rgba(60, 50, 40, 0.9)';
    ctx.shadowColor = 'rgba(150, 130, 100, 0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(0, 5, 12, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // 刀镡装饰
    ctx.strokeStyle = 'rgba(180, 160, 120, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 5, 8, 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 刀柄（深色，缠绕纹理）
    ctx.fillStyle = 'rgba(30, 25, 20, 0.9)';
    ctx.shadowColor = 'rgba(100, 80, 60, 0.2)';
    ctx.shadowBlur = 5;
    ctx.fillRect(-2.5, 8, 5, 22);
    // 柄缠
    ctx.strokeStyle = 'rgba(80, 60, 45, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-2.5, 10 + i * 4);
      ctx.lineTo(2.5, 12 + i * 4);
      ctx.stroke();
    }

    // 流苏/剑穗（黑灰色，向右飘动）
    ctx.strokeStyle = 'rgba(60, 55, 50, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    const tasselWave = Math.sin(time * 2.5) * 6;
    const tasselWave2 = Math.sin(time * 2 + 1) * 5;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(8 + tasselWave, 38, 14 + tasselWave2, 52);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1, 30);
    ctx.quadraticCurveTo(12 + tasselWave2, 42, 18 + tasselWave, 58);
    ctx.stroke();
    // 穗尾
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(14 + tasselWave2, 52);
    ctx.quadraticCurveTo(16 + tasselWave, 58, 12 + tasselWave2, 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18 + tasselWave, 58);
    ctx.quadraticCurveTo(22 + tasselWave2, 64, 16 + tasselWave, 68);
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.restore(); // 刀结束

    // ══════════════════════════════════════
    //  刀鞘（腰间左侧）
    // ══════════════════════════════════════
    ctx.fillStyle = 'rgba(20, 18, 15, 0.85)';
    ctx.strokeStyle = 'rgba(100, 160, 180, 0.15)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 5;
    ctx.save();
    ctx.translate(-18, -6);
    ctx.rotate(0.6);
    ctx.beginPath();
    ctx.roundRect(-2.5, -30, 5, 55, 2);
    ctx.fill();
    ctx.stroke();
    // 鞘口装饰
    ctx.fillStyle = 'rgba(80, 60, 45, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, -28, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ══════════════════════════════════════
    //  轮廓光（逆光边缘勾勒）
    // ══════════════════════════════════════
    ctx.strokeStyle = rimColorBright;
    ctx.lineWidth = 0.8;
    ctx.shadowColor = 'rgba(140, 200, 220, 0.4)';
    ctx.shadowBlur = 12;
    // 身体右侧轮廓光
    ctx.beginPath();
    ctx.moveTo(24, -28);
    ctx.quadraticCurveTo(28, 0, 26, 32);
    ctx.stroke();
    // 斗笠边缘轮廓光
    ctx.beginPath();
    ctx.ellipse(0, -62, 38, 8, 0, -0.3, Math.PI + 0.3);
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.restore();
  },

  // ── 大气粒子（雨滴/灰烬/雾气微粒）──
  _drawAtmosphericParticles(ctx, cx, cy, radius, time) {
    const count = 25;
    for (let i = 0; i < count; i++) {
      const seed = i * 137.5;
      const angle = (seed % 360) * Math.PI / 180;
      const dist = 30 + (seed % radius);
      const fallSpeed = 0.8 + (i % 5) * 0.3;
      const px = cx + Math.cos(angle + time * 0.1) * dist;
      const py = cy + ((time * fallSpeed * 30 + seed * 3) % (radius * 2)) - radius;
      const alpha = 0.15 + Math.sin(time * 2 + seed) * 0.1;
      const size = 0.8 + (i % 3) * 0.4;

      ctx.fillStyle = `rgba(160, 200, 220, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  // ── 绘制敌人（精致版）──
  drawEnemy() {
    const { ctx, W, H, time } = this;
    const e = this.enemyData;
    const c = this.elemColors[e.elem] || this.elemColors['火'];
    const x = W * 0.78;
    const y = H * 0.48;
    const breath = Math.sin(time * 1.2 + 1) * 3;
    const scale = Math.min(W, H) / 380;

    ctx.save();
    ctx.translate(x, y + breath);
    ctx.scale(scale, scale);

    // ── 脚下光环 ──
    this._drawGroundGlow(ctx, 0, 75, 110, 28, c, time);

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = c.primary;
    ctx.shadowBlur = 18;

    if (e.type === 'beast' || e.type === 'spirit' || e.type === 'dragon') {
      this._drawBeast(ctx, c, time, e.type);
    } else {
      this._drawHumanoidEnemy(ctx, c, time);
    }

    // ── 元素粒子环绕 ──
    this._drawElemParticles(ctx, 0, -20, 70, c, time, 10);

    ctx.restore();
  },

  // ── 兽形敌人 ──
  _drawBeast(ctx, c, time, type) {
    // 身体（流线型）
    ctx.beginPath();
    ctx.moveTo(-45, -5);
    ctx.quadraticCurveTo(-30, -30, 0, -25);
    ctx.quadraticCurveTo(30, -28, 45, -10);
    ctx.quadraticCurveTo(50, 0, 40, 10);
    ctx.quadraticCurveTo(20, 18, 0, 15);
    ctx.quadraticCurveTo(-25, 18, -40, 10);
    ctx.quadraticCurveTo(-48, 2, -45, -5);
    ctx.fill();
    ctx.stroke();

    // 鳞片/毛发纹理
    ctx.strokeStyle = c.glow + '0.15)';
    ctx.lineWidth = 0.6;
    for (let i = -30; i < 30; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, -20);
      ctx.quadraticCurveTo(i + 4, -10, i, 5);
      ctx.stroke();
    }
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 1.8;

    // 头部
    ctx.beginPath();
    ctx.moveTo(30, -18);
    ctx.quadraticCurveTo(50, -30, 58, -22);
    ctx.quadraticCurveTo(62, -15, 55, -8);
    ctx.quadraticCurveTo(45, 0, 35, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 角（如果有）
    if (type === 'dragon') {
      ctx.fillStyle = c.dark;
      ctx.beginPath();
      ctx.moveTo(48, -28);
      ctx.quadraticCurveTo(55, -45, 62, -40);
      ctx.quadraticCurveTo(58, -30, 50, -25);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(52, -26);
      ctx.quadraticCurveTo(58, -42, 65, -38);
      ctx.quadraticCurveTo(60, -28, 54, -23);
      ctx.fill();
      ctx.stroke();
    }

    // 耳朵
    ctx.beginPath();
    ctx.moveTo(42, -26);
    ctx.lineTo(48, -38);
    ctx.lineTo(52, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 眼睛（凶狠发光）
    ctx.fillStyle = c.primary;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.ellipse(50, -20, 4, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // 瞳孔
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.ellipse(51, -20, 1.5, 2.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 嘴（微张，露出牙齿）
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.moveTo(55, -12);
    ctx.quadraticCurveTo(60, -10, 58, -6);
    ctx.quadraticCurveTo(54, -8, 55, -12);
    ctx.fill();
    // 獠牙
    ctx.fillStyle = 'rgba(220,220,220,0.7)';
    ctx.beginPath();
    ctx.moveTo(56, -11);
    ctx.lineTo(57, -6);
    ctx.lineTo(55, -8);
    ctx.fill();

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';
    ctx.shadowBlur = 12;

    // 前腿（有肌肉感）
    ctx.beginPath();
    ctx.moveTo(25, 8);
    ctx.quadraticCurveTo(28, 30, 30, 55);
    ctx.lineTo(38, 55);
    ctx.quadraticCurveTo(36, 30, 33, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 爪子
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(28, 55);
    ctx.lineTo(26, 60);
    ctx.lineTo(30, 58);
    ctx.lineTo(34, 60);
    ctx.lineTo(38, 58);
    ctx.lineTo(40, 55);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';

    // 后腿
    ctx.beginPath();
    ctx.moveTo(-25, 8);
    ctx.quadraticCurveTo(-28, 30, -30, 55);
    ctx.lineTo(-22, 55);
    ctx.quadraticCurveTo(-20, 30, -18, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 爪子
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(-30, 55);
    ctx.lineTo(-32, 60);
    ctx.lineTo(-28, 58);
    ctx.lineTo(-24, 60);
    ctx.lineTo(-20, 58);
    ctx.lineTo(-18, 55);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';

    // 尾巴（多段曲线，更灵动）
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.quadraticCurveTo(-55, -10 + Math.sin(time * 2.5) * 6, -65, -25 + Math.sin(time * 2) * 8);
    ctx.quadraticCurveTo(-70, -35 + Math.sin(time * 3) * 5, -72, -42 + Math.sin(time * 2.8) * 6);
    ctx.lineWidth = 4;
    ctx.stroke();
    // 尾尖
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-72, -42 + Math.sin(time * 2.8) * 6);
    ctx.quadraticCurveTo(-76, -48 + Math.sin(time * 3.2) * 4, -78, -50 + Math.sin(time * 3) * 5);
    ctx.stroke();
    ctx.lineWidth = 1.8;
  },

  // ── 人形敌人 ──
  _drawHumanoidEnemy(ctx, c, time) {
    // 身体（铠甲风格，宽肩）
    ctx.beginPath();
    ctx.moveTo(-30, -25);
    ctx.quadraticCurveTo(-34, 0, -28, 30);
    ctx.quadraticCurveTo(-20, 50, -12, 65);
    ctx.lineTo(12, 65);
    ctx.quadraticCurveTo(20, 50, 28, 30);
    ctx.quadraticCurveTo(34, 0, 30, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 肩甲
    ctx.fillStyle = c.dark;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(-28, -22, 10, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, -22, 10, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 胸甲纹路
    ctx.strokeStyle = c.glow + '0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-18, -15);
    ctx.lineTo(0, -8);
    ctx.lineTo(18, -15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.quadraticCurveTo(0, 5, 15, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.quadraticCurveTo(0, 16, 12, 8);
    ctx.stroke();
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 1.8;

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';
    ctx.shadowBlur = 15;

    // 头部（带头盔感）
    ctx.beginPath();
    ctx.moveTo(-16, -35);
    ctx.quadraticCurveTo(-18, -55, -12, -62);
    ctx.quadraticCurveTo(0, -68, 12, -62);
    ctx.quadraticCurveTo(18, -55, 16, -35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 面罩纹路
    ctx.strokeStyle = c.glow + '0.2)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-8, -55);
    ctx.lineTo(-8, -40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -55);
    ctx.lineTo(8, -40);
    ctx.stroke();
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 1.8;

    // 眼睛（凶狠发光）
    ctx.fillStyle = c.primary;
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.ellipse(-6, -50, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -50, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛内光
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-7, -51, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(5, -51, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';
    ctx.shadowBlur = 12;

    // 左臂（有护臂）
    ctx.beginPath();
    ctx.moveTo(-30, -20);
    ctx.quadraticCurveTo(-42, -5, -44, 15);
    ctx.quadraticCurveTo(-42, 25, -35, 22);
    ctx.lineTo(-28, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 护臂
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.ellipse(-40, 10, 6, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';

    // 右臂（持武器）
    ctx.beginPath();
    ctx.moveTo(30, -20);
    ctx.quadraticCurveTo(42, -5, 44, 15);
    ctx.quadraticCurveTo(42, 25, 35, 22);
    ctx.lineTo(28, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // 护臂
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.ellipse(40, 10, 6, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(5, 8, 18, 0.92)';

    // 腿部（有护腿）
    ctx.beginPath();
    ctx.moveTo(-15, 45);
    ctx.quadraticCurveTo(-18, 55, -16, 70);
    ctx.lineTo(-8, 70);
    ctx.quadraticCurveTo(-6, 55, -8, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(8, 45);
    ctx.quadraticCurveTo(6, 55, 8, 70);
    ctx.lineTo(16, 70);
    ctx.quadraticCurveTo(18, 55, 15, 45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 武器（暗红大刀，更精致）
    ctx.save();
    ctx.translate(-40, -10);
    ctx.rotate(0.7 + Math.sin(time * 1.8) * 0.04);
    // 刀身
    const bladeGrad = ctx.createLinearGradient(0, -60, 0, 0);
    bladeGrad.addColorStop(0, 'rgba(180, 50, 40, 0.8)');
    bladeGrad.addColorStop(0.5, 'rgba(140, 35, 25, 0.7)');
    bladeGrad.addColorStop(1, 'rgba(100, 25, 18, 0.6)');
    ctx.fillStyle = bladeGrad;
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(4, 0);
    ctx.quadraticCurveTo(7, -25, 5, -45);
    ctx.lineTo(0, -58);
    ctx.lineTo(-3, -45);
    ctx.quadraticCurveTo(-2, -25, -3, 0);
    ctx.fill();
    ctx.stroke();
    // 刀格
    ctx.fillStyle = 'rgba(60, 20, 15, 0.8)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 刀柄
    ctx.fillStyle = 'rgba(40, 15, 10, 0.8)';
    ctx.fillRect(-3, 3, 6, 16);
    ctx.restore();
  },

  // ── 地面光环 ──
  _drawGroundGlow(ctx, x, y, rx, ry, c, time) {
    const pulse = Math.sin(time * 2) * 0.15 + 0.85;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rx);
    grad.addColorStop(0, c.glow + (0.12 * pulse) + ')');
    grad.addColorStop(0.5, c.glow + (0.05 * pulse) + ')');
    grad.addColorStop(1, c.glow + '0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  // ── 元素粒子环绕 ──
  _drawElemParticles(ctx, cx, cy, radius, c, time, count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + time * 0.5;
      const r = radius + Math.sin(time * 2 + i) * 8;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r * 0.5;
      const alpha = Math.sin(time * 3 + i * 1.5) * 0.3 + 0.4;
      const size = 1.5 + Math.sin(time * 2.5 + i) * 0.8;

      ctx.fillStyle = c.glow + alpha + ')';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  },
};

function showCombat() {
  const combat = gameState.combat;
  if (!combat) return;

  const modal = document.getElementById('combatModal');
  modal.style.display = 'flex';

  // 显示敌人名称
  const enemyName = combat.enemy?.name || '妖物';
  const centerText = document.getElementById('combatCenterText');
  if (centerText) centerText.textContent = `— ${enemyName} —`;

  // 初始化玩家信息
  const p = combat.player || {};
  const e = combat.enemy || {};
  setText('combatPlayerName', p.name || '你');
  setText('combatPlayerRealm', p.realm || '');
  setText('combatEnemyName', e.name || '敌人');
  setText('combatEnemyRealm', e.realm || '');

  // 敌人属性
  const elem = Array.isArray(e.element) ? e.element[0] : (e.element || '');
  const elemEl = document.getElementById('combatEnemyElem');
  if (elemEl) {
    elemEl.textContent = elem;
    elemEl.setAttribute('data-elem', elem);
  }

  updateCombatHp('combatHpBar', 'combatHpText', p.hp, p.max_hp);
  updateCombatHp('combatMpBar', 'combatMpText', p.mp, p.max_mp);
  updateCombatHp('combatEnemyHpBar', 'combatEnemyHpText', e.hp, e.max_hp);

  // 设置角色剪影
  const playerElem = Array.isArray(p.element) ? p.element[0] : (p.element || '金');
  combatStarfield.setPlayer(playerElem, p.realm);
  combatStarfield.setEnemy(elem, e.type);

  // 清空战斗日志
  const logBox = document.getElementById('combatLogBox');
  if (logBox) logBox.innerHTML = '';

  // 神通列表
  const abilityList = document.getElementById('combatAbilityList');
  if (abilityList) {
    abilityList.innerHTML = '';
    const abilities = p.abilities || [];
    abilities.forEach(name => {
      const div = document.createElement('div');
      div.className = 'combat-ability-item';
      div.textContent = name;
      div.onclick = () => doCombat('ability', name);
      abilityList.appendChild(div);
    });
    if (abilities.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'font-size:12px;color:rgba(140,150,180,0.4);text-align:center;padding:20px 0;';
      empty.textContent = '暂无神通';
      abilityList.appendChild(empty);
    }
  }

  // 技能列表（取前5个）
  const skillList = document.getElementById('combatSkillList');
  if (skillList) {
    skillList.innerHTML = '';
    const skills = (p.skills || []).slice(0, 5);
    const elemIcons = { '金': '⚔️', '木': '🌿', '水': '💧', '火': '🔥', '土': '🪨' };
    skills.forEach(name => {
      const div = document.createElement('div');
      div.className = 'combat-skill-item';
      div.onclick = () => doCombat('skill', name);
      const skillData = gameState.gameData?.skills?.[name];
      const isSword = skillData?.is_sword;
      const elem = isSword ? '无' : (skillData?.element || '无');
      const cost = skillData?.cost || 0;
      const dmg = skillData?.damage || 0;
      const elemShort = elem === '无' ? '无' : elem.charAt(0);
      const isHeal = dmg < 0;
      const dmgText = isHeal ? `回复${Math.abs(dmg)}` : `伤害${dmg}`;
      const dmgClass = isHeal ? 'stat-heal' : 'stat-dmg';
      div.innerHTML = `
        <div class="skill-top">
          <div class="skill-elem-circle" data-elem="${elem}">${elemShort}</div>
          <span class="skill-top-name">${name}</span>
        </div>
        <div class="skill-divider"></div>
        <div class="skill-stats">
          <span class="stat-cost">灵力：${cost}</span>
          <span class="${dmgClass}">${dmgText}</span>
        </div>
      `;
      skillList.appendChild(div);
    });
    // 不足5个时用空框填充
    for (let i = skills.length; i < 5; i++) {
      const empty = document.createElement('div');
      empty.className = 'combat-skill-item';
      empty.style.opacity = '0.25';
      empty.innerHTML = `
        <div class="skill-top">
          <div class="skill-elem-circle" data-elem="">✦</div>
          <span class="skill-top-name">空</span>
        </div>
        <div class="skill-divider"></div>
        <div class="skill-stats"><span>-</span><span>-</span></div>
      `;
      skillList.appendChild(empty);
    }
  }

  // 启动星空
  combatStarfield.init();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '';
}

function updateCombatHp(barId, textId, hp, maxHp) {
  const bar = document.getElementById(barId);
  const text = document.getElementById(textId);
  if (!bar || !text) return;
  const h = Math.max(0, hp || 0);
  const m = Math.max(1, maxHp || 1);
  const pct = Math.round(h / m * 100);
  // 用 anime.js 做平滑动画
  if (typeof anime !== 'undefined') {
    anime.remove(bar);
    anime({
      targets: bar,
      width: pct + '%',
      duration: 500,
      easing: 'easeOutQuad',
    });
  } else {
    bar.style.width = pct + '%';
  }
  text.textContent = `${h}/${m}`;
  // HP 归零时变灰
  if (h <= 0) {
    bar.classList.add('dead');
  } else {
    bar.classList.remove('dead');
  }
}

function addCombatLogEntry(msg, cls) {
  const logBox = document.getElementById('combatLogBox');
  if (!logBox) return;
  const div = document.createElement('div');
  div.className = 'combat-log-entry' + (cls ? ' ' + cls : '');
  div.textContent = msg;
  logBox.appendChild(div);
  logBox.scrollTop = logBox.scrollHeight;
  // 最多保留 30 条
  while (logBox.children.length > 30) logBox.removeChild(logBox.firstChild);
}

// Cooldown tracking
const _cardCooldowns = {};
function startCardCooldown(cardEl, turns) {
  const name = cardEl.querySelector('.card-name')?.textContent;
  if (!name) return;
  _cardCooldowns[name] = turns;
  const overlay = document.createElement('div');
  overlay.className = 'card-cooldown';
  overlay.textContent = turns;
  cardEl.style.position = 'relative';
  cardEl.appendChild(overlay);
  cardEl.disabled = true;
}

function tickCardCooldowns() {
  Object.keys(_cardCooldowns).forEach(name => {
    _cardCooldowns[name]--;
    if (_cardCooldowns[name] <= 0) {
      delete _cardCooldowns[name];
    }
  });
  // Remove expired cooldown overlays
  document.querySelectorAll('.card-cooldown').forEach(el => {
    const cardName = el.parentElement?.querySelector('.card-name')?.textContent;
    if (cardName && !_cardCooldowns[cardName]) {
      el.remove();
      el.parentElement.disabled = false;
    } else if (cardName && _cardCooldowns[cardName]) {
      el.textContent = _cardCooldowns[cardName];
    }
  });
}

window.doCombat = async function(action, skill) {
  const combat = gameState.combat;
  if (!combat || combat.finished) return;

  try {
    const res = await apiPost('/combat', {
      character: gameState.character,
      combat: combat,
      action: action,
      skill: skill,
      enemy: null,
    });

    if (!res.success) {
      showToast(res.message || '操作失败', 'danger');
      return;
    }

    const oldEnemyHp = combat.enemy.hp;
    const oldPlayerHp = combat.player.hp;

    // [UI removed] — attack/defend/flee animations stripped

    // 更新数据
    gameState.combat = res.combat;
    const c = res.combat;

    // 更新血条
    updateCombatHp('combatHpBar', 'combatHpText', c.player.hp, c.player.max_hp);
    updateCombatHp('combatMpBar', 'combatMpText', c.player.mp, c.player.max_mp);
    updateCombatHp('combatEnemyHpBar', 'combatEnemyHpText', c.enemy.hp, c.enemy.max_hp);

    // 战斗日志
    const oldLen = combat.log.length;
    const newLogs = c.log.slice(oldLen);
    newLogs.forEach(msg => {
      let cls = '';
      if (msg.includes('你') || msg.includes('玩家')) cls = 'player-action';
      else if (msg.includes('敌') || msg.includes(c.enemy?.name)) cls = 'enemy-action';
      addCombatLogEntry(msg, cls);
    });

    // Combo tracking (logic only)
    if (action !== 'defend' && action !== 'flee') {
      const enemyDmg = oldEnemyHp - res.combat.enemy.hp;
      if (enemyDmg > 0) {
        const lastLogs = res.combat.log.slice(oldLen);
        const isCrit = lastLogs.some(msg => msg.includes('暴击'));
        updateComboCounter(isCrit);

        // SFX only (no visual effects)
        if (action === 'skill' || action === 'ability') {
          if (typeof playSfx === 'function') playSfx('spell');
        } else {
          if (typeof playSfx === 'function') playSfx('hit');
        }
        if (isCrit) {
          if (typeof playSfx === 'function') playSfx('critical');
        }
      }
    }

    // SFX
    if (action === 'defend' && typeof playSfx === 'function') playSfx('defend');
    if (action === 'flee' && typeof playSfx === 'function') playSfx('flee');

    const playerDmg = oldPlayerHp - res.combat.player.hp;
    if (playerDmg > 0) {
      if (typeof playSfx === 'function') playSfx('hurt');
    }

    if (res.combat.player.hp > oldPlayerHp) {
      if (typeof playSfx === 'function') playSfx('heal');
    }

    // [UI removed] — turn indicator, enemy attack animation, crit flash overlay all stripped

    // 战斗结束
    if (res.combat.finished) {
      await new Promise(r => setTimeout(r, 500));
      if (res.combat.victory === true) {
        showCombatResult(true, res.result);
        checkAchievementsAfterAction();
      } else {
        showCombatResult(false, null);
      }
      await reloadCharacter();
    }

    if (res.summary) {
      gameState.character.hp = res.summary.hp;
      gameState.character.mp = res.summary.mp;
    }
  } catch (err) {
    console.error('Combat error:', err);
    showToast('战斗出错，请重试', 'danger');
  }
};

function showCombatResult(isVictory, result) {
  // 战斗结束音效+BGM
  if (typeof playSfx === 'function') playSfx(isVictory ? 'victory' : 'defeat');
  if (typeof playBgmForRegion === 'function') playBgmForRegion(gameState.character?.region || '青云镇');

  // 显示结果文字
  const centerText = document.getElementById('combatCenterText');
  if (centerText) centerText.textContent = isVictory ? '— 胜利 —' : '— 败北 —';

  // 淡出关闭战斗界面
  setTimeout(() => {
    const modal = document.getElementById('combatModal');
    modal.style.transition = 'opacity 0.5s ease-out';
    modal.style.opacity = '0';
    setTimeout(() => {
      combatStarfield.stop();
      modal.style.display = 'none';
      modal.style.opacity = '';
      modal.style.transition = '';
    }, 500);
  }, 1500);

  gameState.combat = null;
}



// ============================================================
// SVG 骨骼动画系统（暗影格斗风格）
// ============================================================

const SkeletonBones = {
  player: {
    head:       { path: 'M0,-17 A14,17 0 1,1 0.01,-17 Z', anchor: [0, 0] },
    hair:       { path: 'M-8,-18 A8,7 0 1,1 8,-18 L10,-20 L-10,-20 Z', anchor: [0, -18] },
    torso:      { path: 'M-20,-70 Q-24,-35 -22,0 L22,0 Q24,-35 20,-70 Z', anchor: [0, 0] },
    collar:     { path: 'M-3,-70 L-14,-50 L0,-35 L14,-50 L3,-70 Z', anchor: [0, -55] },
    belt:       { path: 'M-24,-25 L24,-25 L22,-18 L-22,-18 Z', anchor: [0, -22] },
    arm_upper_l:{ path: 'M-4,-22 L4,-22 L6,0 L-6,0 Z', anchor: [0, 0] },
    arm_lower_l:{ path: 'M-3.5,-20 L3.5,-20 L4,0 L-4,0 Z', anchor: [0, 0] },
    arm_upper_r:{ path: 'M-4,-22 L4,-22 L6,0 L-6,0 Z', anchor: [0, 0] },
    arm_lower_r:{ path: 'M-3.5,-20 L3.5,-20 L4,0 L-4,0 Z', anchor: [0, 0] },
    weapon:     { path: 'M-1.5,-45 L1.5,-45 L2,0 L-2,0 Z', anchor: [0, 0] },
    weapon_glow:{ path: 'M-3,-48 Q0,-55 3,-48 L4,2 L-4,2 Z', anchor: [0, 0] },
    leg_upper_l:{ path: 'M-5,-28 L5,-28 L7,0 L-7,0 Z', anchor: [0, 0] },
    leg_lower_l:{ path: 'M-4.5,-26 L4.5,-26 L6,0 L-6,0 Z', anchor: [0, 0] },
    leg_upper_r:{ path: 'M-5,-28 L5,-28 L7,0 L-7,0 Z', anchor: [0, 0] },
    leg_lower_r:{ path: 'M-4.5,-26 L4.5,-26 L6,0 L-6,0 Z', anchor: [0, 0] },
    robe_l:     { path: 'M-8,-30 Q-18,0 -12,30 L-4,30 Q-6,0 0,-30 Z', anchor: [0, 0] },
    robe_r:     { path: 'M0,-30 Q6,0 4,30 L12,30 Q18,0 8,-30 Z', anchor: [0, 0] },
    eye_l:      { path: 'M-2,-1.5 A2,1.5 0 1,1 2,-1.5 A2,1.5 0 1,1 -2,-1.5 Z', anchor: [-5, -5] },
    eye_r:      { path: 'M-2,-1.5 A2,1.5 0 1,1 2,-1.5 A2,1.5 0 1,1 -2,-1.5 Z', anchor: [5, -5] },
  },
  enemy: {
    body:       { path: 'M-35,-40 Q-40,-15 -30,15 L30,15 Q40,-15 35,-40 Q20,-55 0,-50 Q-20,-55 -35,-40 Z', anchor: [0, 15] },
    head:       { path: 'M-22,-18 Q-25,-35 0,-38 Q25,-35 22,-18 Q15,-8 0,-6 Q-15,-8 -22,-18 Z', anchor: [0, 0] },
    horn_l:     { path: 'M-3,0 L-12,-22 L-6,-20 L-1,-5 Z', anchor: [-14, -10] },
    horn_r:     { path: 'M1,0 L12,-22 L6,-20 L3,-5 Z', anchor: [14, -10] },
    jaw:        { path: 'M-14,-2 Q-16,8 0,10 Q16,8 14,-2 L10,-4 Q5,-6 0,-5 Q-5,-6 -10,-4 Z', anchor: [0, -2] },
    fang_l:     { path: 'M-3,-2 L-5,8 L-1,3 Z', anchor: [-6, 0] },
    fang_r:     { path: 'M3,-2 L5,8 L1,3 Z', anchor: [6, 0] },
    leg_front_l:{ path: 'M-5,-20 L5,-20 L6,0 L-6,0 Z', anchor: [0, 0] },
    leg_front_r:{ path: 'M-5,-20 L5,-20 L6,0 L-6,0 Z', anchor: [0, 0] },
    leg_rear_l: { path: 'M-5,-22 L5,-22 L7,0 L-7,0 Z', anchor: [0, 0] },
    leg_rear_r: { path: 'M-5,-22 L5,-22 L7,0 L-7,0 Z', anchor: [0, 0] },
    paw_fl:     { path: 'M-7,-3 L7,-3 L8,3 L-8,3 Z', anchor: [0, 0] },
    paw_fr:     { path: 'M-7,-3 L7,-3 L8,3 L-8,3 Z', anchor: [0, 0] },
    paw_rl:     { path: 'M-8,-3 L8,-3 L9,3 L-9,3 Z', anchor: [0, 0] },
    paw_rr:     { path: 'M-8,-3 L8,-3 L9,3 L-9,3 Z', anchor: [0, 0] },
    tail:       { path: 'M-3,-3 Q-20,-15 -30,-35 Q-28,-38 -22,-30 Q-15,-12 0,0 Z', anchor: [0, 0] },
    eye_l:      { path: 'M-3,-2 A3,2 0 1,1 3,-2 A3,2 0 1,1 -3,-2 Z', anchor: [-10, -15] },
    eye_r:      { path: 'M-3,-2 A3,2 0 1,1 3,-2 A3,2 0 1,1 -3,-2 Z', anchor: [10, -15] },
    spine:      { path: 'M0,-40 L0,10', anchor: [0, 0], isLine: true },
    ribs:       { path: 'M-25,-30 Q-10,-25 0,-28 M0,-28 Q10,-25 25,-30 M-22,-18 Q-8,-13 0,-16 M0,-16 Q8,-13 22,-18', anchor: [0, 0], isLine: true },
  },
  // 灵体 — 核心球 + 飘浮碎片 + 光环
  spirit: {
    core:       { path: 'M0,-20 A20,20 0 1,1 0.01,-20 Z', anchor: [0, -20] },
    fragment_l: { path: 'M-8,-4 L0,-8 L8,-4 L4,4 L-4,4 Z', anchor: [-30, -15] },
    fragment_r: { path: 'M-8,-4 L0,-8 L8,-4 L4,4 L-4,4 Z', anchor: [30, -15] },
    ring:       { path: 'M-35,0 A35,10 0 1,1 35,0 A35,10 0 1,1 -35,0', anchor: [0, 0], isLine: true },
    eye_l:      { path: 'M-4,-2 A4,2 0 1,1 4,-2 A4,2 0 1,1 -4,-2 Z', anchor: [-8, -22] },
    eye_r:      { path: 'M-4,-2 A4,2 0 1,1 4,-2 A4,2 0 1,1 -4,-2 Z', anchor: [8, -22] },
    aura:       { path: 'M-40,-50 Q-50,0 -40,50 Q0,60 40,50 Q50,0 40,-50 Q0,-60 -40,-50 Z', anchor: [0, 0], isLine: true },
    tendril_l:  { path: 'M-20,10 Q-35,25 -30,45 Q-25,50 -20,40 Q-15,25 -10,15', anchor: [0, 0], isLine: true },
    tendril_r:  { path: 'M20,10 Q35,25 30,45 Q25,50 20,40 Q15,25 10,15', anchor: [0, 0], isLine: true },
  },
  // 人形 — 类人战士形态
  humanoid: {
    torso:      { path: 'M-22,-65 Q-26,-30 -24,0 L24,0 Q26,-30 22,-65 Z', anchor: [0, 0] },
    head:       { path: 'M0,-16 A13,16 0 1,1 0.01,-16 Z', anchor: [0, 0] },
    helm:       { path: 'M-14,-16 Q-16,-28 0,-30 Q16,-28 14,-16 L10,-14 Q5,-12 0,-13 Q-5,-12 -10,-14 Z', anchor: [0, -16] },
    arm_upper_l:{ path: 'M-5,-20 L5,-20 L7,0 L-7,0 Z', anchor: [0, 0] },
    arm_lower_l:{ path: 'M-4,-18 L4,-18 L5,0 L-5,0 Z', anchor: [0, 0] },
    arm_upper_r:{ path: 'M-5,-20 L5,-20 L7,0 L-7,0 Z', anchor: [0, 0] },
    arm_lower_r:{ path: 'M-4,-18 L4,-18 L5,0 L-5,0 Z', anchor: [0, 0] },
    weapon:     { path: 'M-2,-40 L2,-40 L3,0 L-3,0 Z', anchor: [0, 0] },
    leg_upper_l:{ path: 'M-6,-26 L6,-26 L8,0 L-8,0 Z', anchor: [0, 0] },
    leg_lower_l:{ path: 'M-5,-24 L5,-24 L7,0 L-7,0 Z', anchor: [0, 0] },
    leg_upper_r:{ path: 'M-6,-26 L6,-26 L8,0 L-8,0 Z', anchor: [0, 0] },
    leg_lower_r:{ path: 'M-5,-24 L5,-24 L7,0 L-7,0 Z', anchor: [0, 0] },
    cape_l:     { path: 'M-6,-65 Q-20,-30 -16,10 Q-10,15 -4,5 Q-2,-30 0,-65 Z', anchor: [0, 0], isLine: true },
    cape_r:     { path: 'M6,-65 Q20,-30 16,10 Q10,15 4,5 Q2,-30 0,-65 Z', anchor: [0, 0], isLine: true },
    eye_l:      { path: 'M-2,-1.5 A2,1.5 0 1,1 2,-1.5 A2,1.5 0 1,1 -2,-1.5 Z', anchor: [-5, -5] },
    eye_r:      { path: 'M-2,-1.5 A2,1.5 0 1,1 2,-1.5 A2,1.5 0 1,1 -2,-1.5 Z', anchor: [5, -5] },
  },
  // 龙族 — 蛇身 + 翅膀 + 龙角
  dragon: {
    body_seg1:  { path: 'M-18,-15 Q-22,0 -18,15 L18,15 Q22,0 18,-15 Z', anchor: [0, 0] },
    body_seg2:  { path: 'M-16,-12 Q-20,0 -16,12 L16,12 Q20,0 16,-12 Z', anchor: [0, 0] },
    body_seg3:  { path: 'M-14,-10 Q-17,0 -14,10 L14,10 Q17,0 14,-10 Z', anchor: [0, 0] },
    head:       { path: 'M-18,-20 Q-22,-35 0,-38 Q22,-35 18,-20 Q12,-8 0,-5 Q-12,-8 -18,-20 Z', anchor: [0, 0] },
    horn_l:     { path: 'M-2,0 L-10,-28 L-5,-25 L0,-5 Z', anchor: [-12, -14] },
    horn_r:     { path: 'M2,0 L10,-28 L5,-25 L0,-5 Z', anchor: [12, -14] },
    jaw:        { path: 'M-12,-2 Q-14,10 0,12 Q14,10 12,-2 L8,-4 Q4,-6 0,-5 Q-4,-6 -8,-4 Z', anchor: [0, -2] },
    wing_l:     { path: 'M0,-10 L-50,-45 L-55,-30 L-45,-15 L-30,-5 L0,0 Z', anchor: [0, -5] },
    wing_r:     { path: 'M0,-10 L50,-45 L55,-30 L45,-15 L30,-5 L0,0 Z', anchor: [0, -5] },
    claw_l:     { path: 'M-5,0 L-8,15 L-3,12 L0,5 L3,12 L8,15 L5,0 Z', anchor: [0, 0] },
    claw_r:     { path: 'M-5,0 L-8,15 L-3,12 L0,5 L3,12 L8,15 L5,0 Z', anchor: [0, 0] },
    tail:       { path: 'M-3,-3 Q-15,-8 -30,-5 Q-40,0 -35,10 Q-30,15 -20,8 Q-10,0 0,0 Z', anchor: [0, 0] },
    tail_tip:   { path: 'M-8,-5 L0,-15 L8,-5 L4,0 L-4,0 Z', anchor: [-25, 5] },
    eye_l:      { path: 'M-3,-2 A3,2 0 1,1 3,-2 A3,2 0 1,1 -3,-2 Z', anchor: [-8, -18] },
    eye_r:      { path: 'M-3,-2 A3,2 0 1,1 3,-2 A3,2 0 1,1 -3,-2 Z', anchor: [8, -18] },
    spine:      { path: 'M0,-15 L0,15 M0,15 L0,40 M0,40 L0,60', anchor: [0, 0], isLine: true },
  },
};

const SkeletonHierarchy = {
  player: {
    torso: ['head', 'collar', 'belt', 'arm_upper_l', 'arm_upper_r', 'leg_upper_l', 'leg_upper_r', 'robe_l', 'robe_r'],
    head: ['hair', 'eye_l', 'eye_r'],
    arm_upper_l: ['arm_lower_l'],
    arm_upper_r: ['arm_lower_r'],
    arm_lower_r: ['weapon', 'weapon_glow'],
    leg_upper_l: ['leg_lower_l'],
    leg_upper_r: ['leg_lower_r'],
  },
  enemy: {
    body: ['head', 'leg_front_l', 'leg_front_r', 'leg_rear_l', 'leg_rear_r', 'tail', 'spine', 'ribs'],
    head: ['horn_l', 'horn_r', 'jaw', 'eye_l', 'eye_r'],
    jaw: ['fang_l', 'fang_r'],
    leg_front_l: ['paw_fl'],
    leg_front_r: ['paw_fr'],
    leg_rear_l: ['paw_rl'],
    leg_rear_r: ['paw_rr'],
  },
  spirit: {
    core: ['fragment_l', 'fragment_r', 'ring', 'eye_l', 'eye_r', 'aura', 'tendril_l', 'tendril_r'],
  },
  humanoid: {
    torso: ['head', 'arm_upper_l', 'arm_upper_r', 'leg_upper_l', 'leg_upper_r', 'cape_l', 'cape_r'],
    head: ['helm', 'eye_l', 'eye_r'],
    arm_upper_l: ['arm_lower_l'],
    arm_upper_r: ['arm_lower_r'],
    arm_lower_r: ['weapon'],
    leg_upper_l: ['leg_lower_l'],
    leg_upper_r: ['leg_lower_r'],
  },
  dragon: {
    body_seg1: ['body_seg2', 'wing_l', 'wing_r', 'claw_l', 'head'],
    body_seg2: ['body_seg3', 'claw_r'],
    body_seg3: ['tail'],
    tail: ['tail_tip'],
    head: ['horn_l', 'horn_r', 'jaw', 'eye_l', 'eye_r'],
  },
};

const SkeletonLayout = {
  player: {
    torso:        { x: 0, y: 0, z: 1 },
    head:         { x: 0, y: -70, z: 5 },
    hair:         { x: 0, y: 0, z: 6 },
    collar:       { x: 0, y: 0, z: 3 },
    belt:         { x: 0, y: 0, z: 3 },
    arm_upper_l:  { x: -22, y: -60, z: 0 },
    arm_lower_l:  { x: 0, y: -22, z: 0 },
    arm_upper_r:  { x: 22, y: -60, z: 4 },
    arm_lower_r:  { x: 0, y: -22, z: 4 },
    weapon:       { x: 0, y: -20, z: 5 },
    weapon_glow:  { x: 0, y: -20, z: 4 },
    leg_upper_l:  { x: -10, y: 0, z: 0 },
    leg_lower_l:  { x: 0, y: -28, z: 0 },
    leg_upper_r:  { x: 10, y: 0, z: 2 },
    leg_lower_r:  { x: 0, y: -28, z: 2 },
    robe_l:       { x: 0, y: 0, z: 2 },
    robe_r:       { x: 0, y: 0, z: 2 },
    eye_l:        { x: 0, y: 0, z: 7 },
    eye_r:        { x: 0, y: 0, z: 7 },
  },
  enemy: {
    body:         { x: 0, y: 0, z: 1 },
    head:         { x: 0, y: -38, z: 5 },
    horn_l:       { x: 0, y: 0, z: 6 },
    horn_r:       { x: 0, y: 0, z: 6 },
    jaw:          { x: 0, y: -6, z: 6 },
    fang_l:       { x: 0, y: 0, z: 7 },
    fang_r:       { x: 0, y: 0, z: 7 },
    leg_front_l:  { x: -22, y: 15, z: 0 },
    leg_front_r:  { x: 22, y: 15, z: 3 },
    leg_rear_l:   { x: -25, y: 15, z: 0 },
    leg_rear_r:   { x: 25, y: 15, z: 3 },
    paw_fl:       { x: 0, y: -20, z: 0 },
    paw_fr:       { x: 0, y: -20, z: 3 },
    paw_rl:       { x: 0, y: -22, z: 0 },
    paw_rr:       { x: 0, y: -22, z: 3 },
    tail:         { x: 30, y: 5, z: 0 },
    eye_l:        { x: 0, y: 0, z: 7 },
    eye_r:        { x: 0, y: 0, z: 7 },
    spine:        { x: 0, y: 0, z: 2 },
    ribs:         { x: 0, y: 0, z: 2 },
  },
  spirit: {
    core:         { x: 0, y: -20, z: 3 },
    fragment_l:   { x: -30, y: -15, z: 1 },
    fragment_r:   { x: 30, y: -15, z: 1 },
    ring:         { x: 0, y: 0, z: 0 },
    eye_l:        { x: 0, y: 0, z: 5 },
    eye_r:        { x: 0, y: 0, z: 5 },
    aura:         { x: 0, y: 0, z: 0 },
    tendril_l:    { x: 0, y: 0, z: 2 },
    tendril_r:    { x: 0, y: 0, z: 2 },
  },
  humanoid: {
    torso:        { x: 0, y: 0, z: 1 },
    head:         { x: 0, y: -65, z: 5 },
    helm:         { x: 0, y: 0, z: 6 },
    arm_upper_l:  { x: -24, y: -55, z: 0 },
    arm_lower_l:  { x: 0, y: -20, z: 0 },
    arm_upper_r:  { x: 24, y: -55, z: 4 },
    arm_lower_r:  { x: 0, y: -20, z: 4 },
    weapon:       { x: 0, y: -18, z: 5 },
    leg_upper_l:  { x: -10, y: 0, z: 0 },
    leg_lower_l:  { x: 0, y: -26, z: 0 },
    leg_upper_r:  { x: 10, y: 0, z: 2 },
    leg_lower_r:  { x: 0, y: -26, z: 2 },
    cape_l:       { x: 0, y: 0, z: 0 },
    cape_r:       { x: 0, y: 0, z: 0 },
    eye_l:        { x: 0, y: 0, z: 7 },
    eye_r:        { x: 0, y: 0, z: 7 },
  },
  dragon: {
    body_seg1:    { x: 0, y: 0, z: 2 },
    body_seg2:    { x: 0, y: 25, z: 1 },
    body_seg3:    { x: 0, y: 25, z: 0 },
    head:         { x: 0, y: -38, z: 5 },
    horn_l:       { x: 0, y: 0, z: 6 },
    horn_r:       { x: 0, y: 0, z: 6 },
    jaw:          { x: 0, y: -5, z: 6 },
    wing_l:       { x: 0, y: -10, z: 3 },
    wing_r:       { x: 0, y: -10, z: 3 },
    claw_l:       { x: -18, y: 15, z: 1 },
    claw_r:       { x: 18, y: 65, z: 0 },
    tail:         { x: 0, y: 10, z: 0 },
    tail_tip:     { x: -25, y: 5, z: 0 },
    eye_l:        { x: 0, y: 0, z: 7 },
    eye_r:        { x: 0, y: 0, z: 7 },
    spine:        { x: 0, y: 0, z: 2 },
  },
};

// ── 骨骼渲染器 ──
class SkeletonRenderer {
  constructor(type, container, color) {
    this.type = type;
    this.container = container;
    this.color = color || '#12101e';
    this.glowColor = '#ffd700';
    this.bones = {};
    this.svg = null;
    this.flashWhite = 0;
    this._idleTl = null;
    this._build();
  }

  _build() {
    const NS = 'http://www.w3.org/2000/svg';
    const bones = SkeletonBones[this.type];
    const layout = SkeletonLayout[this.type];
    const hierarchy = SkeletonHierarchy[this.type];

    this.svg = document.createElementNS(NS, 'svg');
    this.svg.setAttribute('class', 'skeleton-svg');
    this.svg.style.cssText = 'position:absolute;width:100%;height:100%;pointer-events:none;overflow:visible;';
    this.container.appendChild(this.svg);

    // 按 z-index 排序创建骨骼
    const sortedBones = Object.keys(layout).sort((a, b) => (layout[a].z || 0) - (layout[b].z || 0));

    for (const name of sortedBones) {
      const def = bones[name];
      const pos = layout[name];
      if (!def || !pos) continue;

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-bone', name);
      g.style.transformOrigin = `${-def.anchor[0]}px ${-def.anchor[1]}px`;

      if (def.isLine) {
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', def.path);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', this.color);
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linecap', 'round');
        g.appendChild(path);
      } else {
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', def.path);
        path.setAttribute('fill', this.color);
        path.setAttribute('stroke', 'none');
        g.appendChild(path);

        // 眼睛特殊处理
        if (name.startsWith('eye_')) {
          path.setAttribute('fill', this.glowColor);
          path.style.filter = `drop-shadow(0 0 3px ${this.glowColor})`;
          path.style.mixBlendMode = 'screen';
        }
        // 武器发光
        if (name === 'weapon_glow') {
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', this.glowColor);
          path.setAttribute('stroke-width', '1');
          path.style.filter = `drop-shadow(0 0 4px ${this.glowColor})`;
          path.style.mixBlendMode = 'screen';
          path.style.opacity = '0.4';
        }
      }

      this.bones[name] = { el: g, def, pos, rotation: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, alpha: 1 };
    }

    // 构建父子层级
    this._buildHierarchy(hierarchy);
  }

  _buildHierarchy(hierarchy) {
    for (const [parent, children] of Object.entries(hierarchy)) {
      const parentBone = this.bones[parent];
      if (!parentBone) continue;
      for (const childName of children) {
        const childBone = this.bones[childName];
        if (!childBone) continue;
        parentBone.el.appendChild(childBone.el);
      }
    }
    // 将根骨骼添加到 SVG
    const roots = Object.keys(hierarchy);
    for (const name of Object.keys(this.bones)) {
      if (!roots.includes(name)) continue;
      const bone = this.bones[name];
      const pos = bone.pos;
      bone.el.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      this.svg.appendChild(bone.el);
    }
  }

  setBoneTransform(name, { rotation = 0, x = 0, y = 0, scaleX = 1, scaleY = 1, alpha = 1 } = {}) {
    const bone = this.bones[name];
    if (!bone) return;
    bone.rotation = rotation;
    bone.x = x;
    bone.y = y;
    bone.scaleX = scaleX;
    bone.scaleY = scaleY;
    bone.alpha = alpha;
    const pos = bone.pos;
    bone.el.setAttribute('transform',
      `translate(${pos.x + x}, ${pos.y + y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`);
    if (alpha !== 1) bone.el.style.opacity = alpha;
  }

  resetPose() {
    for (const [name, bone] of Object.entries(this.bones)) {
      this.setBoneTransform(name, {});
      bone.el.style.opacity = '';
    }
  }

  setColor(color) {
    this.color = color;
    for (const [name, bone] of Object.entries(this.bones)) {
      if (name.startsWith('eye_') || name === 'weapon_glow') continue;
      const paths = bone.el.querySelectorAll('path');
      paths.forEach(p => {
        if (p.getAttribute('fill') !== 'none') p.setAttribute('fill', color);
        if (p.getAttribute('stroke') !== 'none' && p.getAttribute('stroke')) p.setAttribute('stroke', color);
      });
    }
  }

  setGlowColor(color) {
    this.glowColor = color;
    for (const name of Object.keys(this.bones)) {
      if (name.startsWith('eye_')) {
        const path = this.bones[name].el.querySelector('path');
        if (path) {
          path.setAttribute('fill', color);
          path.style.filter = `drop-shadow(0 0 3px ${color})`;
        }
      }
      if (name === 'weapon_glow') {
        const path = this.bones[name].el.querySelector('path');
        if (path) {
          path.setAttribute('stroke', color);
          path.style.filter = `drop-shadow(0 0 4px ${color})`;
        }
      }
    }
  }

  flash(duration = 300) {
    for (const bone of Object.values(this.bones)) {
      const paths = bone.el.querySelectorAll('path[fill]:not([fill="none"])');
      paths.forEach(p => {
        if (p.style.mixBlendMode === 'screen') return;
        const orig = p.getAttribute('fill');
        p.setAttribute('fill', '#fff');
        setTimeout(() => p.setAttribute('fill', orig), duration);
      });
    }
  }

  destroy() {
    if (this._idleTl) this._idleTl.pause();
    if (this.svg && this.svg.parentNode) this.svg.parentNode.removeChild(this.svg);
    this.bones = {};
  }
}

// ── 骨骼动画定义 ──
const SkeletonAnims = {
  // 待机呼吸动画
  idle(skeleton, side = 'player') {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ loop: true, autoplay: true });
    if (side === 'player') {
      tl.add({ targets: { v: 0 }, v: [0, -3, 0], duration: 2000, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('torso', { y: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: [0, 5, 0], duration: 2500, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, -3, 0], duration: 2800, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
    } else if (side === 'spirit') {
      // 灵体：核心漂浮 + 碎片环绕 + 光环旋转
      tl.add({ targets: { v: 0 }, v: [0, -8, 0], duration: 2500, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('core', { y: -20 + a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: [0, 10, 0], duration: 3000, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('fragment_l', { rotation: a.animations[0].currentValue, y: a.animations[0].currentValue * 0.5 }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, -10, 0], duration: 3200, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('fragment_r', { rotation: a.animations[0].currentValue, y: a.animations[0].currentValue * -0.5 }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, 360, 0], duration: 8000, easing: 'linear',
        update: a => { skeleton.setBoneTransform('ring', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, 3, 0], duration: 2000, easing: 'easeInOutSine',
        update: a => {
          skeleton.setBoneTransform('tendril_l', { rotation: a.animations[0].currentValue });
          skeleton.setBoneTransform('tendril_r', { rotation: -a.animations[0].currentValue });
        } }, 0);
    } else if (side === 'humanoid') {
      // 人形：类似玩家但更沉稳
      tl.add({ targets: { v: 0 }, v: [0, -2, 0], duration: 2200, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('torso', { y: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: [0, 4, 0], duration: 2800, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, -3, 0], duration: 2600, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, 2, 0], duration: 3000, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('cape_l', { rotation: a.animations[0].currentValue }); } }, 0);
    } else if (side === 'dragon') {
      // 龙族：蛇身波动 + 翅膀扇动 + 尾巴甩动
      tl.add({ targets: { v: 0 }, v: [0, -5, 0], duration: 2000, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('body_seg1', { y: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: [0, 4, 0], duration: 2200, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('body_seg2', { y: a.animations[0].currentValue }); } }, 200);
      tl.add({ targets: { v: 0 }, v: [0, 3, 0], duration: 2400, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('body_seg3', { y: a.animations[0].currentValue }); } }, 400);
      tl.add({ targets: { v: 0 }, v: [0, 15, 0], duration: 1800, easing: 'easeInOutSine',
        update: a => {
          skeleton.setBoneTransform('wing_l', { rotation: a.animations[0].currentValue });
          skeleton.setBoneTransform('wing_r', { rotation: -a.animations[0].currentValue });
        } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, 8, 0], duration: 2600, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('tail', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, -3, 0], duration: 2000, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('head', { y: a.animations[0].currentValue }); } }, 0);
    } else {
      // beast (default enemy)
      tl.add({ targets: { v: 0 }, v: [0, -4, 0], duration: 1800, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('body', { y: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: [0, 3, 0], duration: 2200, easing: 'easeInOutSine',
        update: a => { skeleton.setBoneTransform('tail', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, -2, 0], duration: 1600, easing: 'easeInOutSine',
        update: a => {
          skeleton.setBoneTransform('leg_front_l', { rotation: a.animations[0].currentValue });
          skeleton.setBoneTransform('leg_rear_r', { rotation: a.animations[0].currentValue });
        } }, 0);
      tl.add({ targets: { v: 0 }, v: [0, 2, 0], duration: 1600, easing: 'easeInOutSine',
        update: a => {
          skeleton.setBoneTransform('leg_front_r', { rotation: a.animations[0].currentValue * -1 });
          skeleton.setBoneTransform('leg_rear_l', { rotation: a.animations[0].currentValue * -1 });
        } }, 0);
    }
    skeleton._idleTl = tl;
    return tl;
  },

  // 玩家攻击动画
  playerAttack(skeleton, callback) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    // 蓄力：后仰
    tl.add({ targets: { v: 0 }, v: -15, duration: 250,
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 0 }, v: -50, duration: 250,
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
    tl.add({ targets: { v: 0 }, v: -30, duration: 250,
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, 0);
    // 冲刺挥砍
    tl.add({ targets: { v: -15 }, v: 12, duration: 180, easing: 'easeInQuad',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: -50 }, v: 70, duration: 180, easing: 'easeInQuad',
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, '-=180');
    tl.add({ targets: { v: -30 }, v: 20, duration: 180, easing: 'easeInQuad',
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, '-=180');
    // 回位
    tl.add({ targets: { v: 12 }, v: 0, duration: 350, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 70 }, v: 0, duration: 350, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, '-=350');
    tl.add({ targets: { v: 20 }, v: 0, duration: 350, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, '-=350');
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },

  // 玩家技能动画（手臂高举下劈）
  playerSkill(skeleton, callback) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    // 后仰蓄力 + 手臂高举
    tl.add({ targets: { v: 0 }, v: -12, duration: 300,
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 0 }, v: -80, duration: 300,
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
    tl.add({ targets: { v: 0 }, v: -40, duration: 300,
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, 0);
    // 前冲下劈
    tl.add({ targets: { v: -12 }, v: 15, duration: 200, easing: 'easeInQuad',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: -80 }, v: 80, duration: 200, easing: 'easeInQuad',
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, '-=200');
    tl.add({ targets: { v: -40 }, v: 30, duration: 200, easing: 'easeInQuad',
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, '-=200');
    // 回位
    tl.add({ targets: { v: 15 }, v: 0, duration: 400, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 80 }, v: 0, duration: 400, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, '-=400');
    tl.add({ targets: { v: 30 }, v: 0, duration: 400, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, '-=400');
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },

  // 玩家神通动画（全身发光 + 双臂挥砍）
  playerAbility(skeleton, callback) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    // 蓄力：后仰 + 双臂展开
    tl.add({ targets: { v: 0 }, v: -18, duration: 400,
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 0 }, v: -60, duration: 400,
      update: a => { skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue }); } }, 0);
    tl.add({ targets: { v: 0 }, v: -60, duration: 400,
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
    // 爆发冲刺
    tl.add({ targets: { v: -18 }, v: 20, duration: 150, easing: 'easeInQuad',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: -60 }, v: 85, duration: 150, easing: 'easeInQuad',
      update: a => {
        skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue });
        skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue });
      } }, '-=150');
    // 回位
    tl.add({ targets: { v: 20 }, v: 0, duration: 500, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 85 }, v: 0, duration: 500, easing: 'easeOutQuad',
      update: a => {
        skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue });
        skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue });
      } }, '-=500');
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },

  // 防御动画
  playerDefend(skeleton, callback) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    // 双臂交叉护胸
    tl.add({ targets: { v: 0 }, v: 30, duration: 250,
      update: a => { skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 0 }, v: -30, duration: 250,
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
    tl.add({ targets: { v: 0 }, v: 40, duration: 250,
      update: a => { skeleton.setBoneTransform('arm_lower_l', { rotation: a.animations[0].currentValue }); } }, 0);
    tl.add({ targets: { v: 0 }, v: -40, duration: 250,
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, 0);
    tl.add({ targets: { v: 0 }, v: 5, duration: 250,
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } }, 0);
    // 保持
    tl.add({ targets: { v: 0 }, duration: 400 });
    // 恢复
    tl.add({ targets: { v: 30 }, v: 0, duration: 300,
      update: a => { skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: -30 }, v: 0, duration: 300,
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, '-=300');
    tl.add({ targets: { v: 40 }, v: 0, duration: 300,
      update: a => { skeleton.setBoneTransform('arm_lower_l', { rotation: a.animations[0].currentValue }); } }, '-=300');
    tl.add({ targets: { v: -40 }, v: 0, duration: 300,
      update: a => { skeleton.setBoneTransform('arm_lower_r', { rotation: a.animations[0].currentValue }); } }, '-=300');
    tl.add({ targets: { v: 5 }, v: 0, duration: 300,
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } }, '-=300');
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },

  // 受击动画
  playerHit(skeleton, callback) {
    const tl = anime.timeline({ easing: 'easeOutElastic' });
    tl.add({ targets: { v: 0 }, v: 20, duration: 150,
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 20 }, v: 0, duration: 500, easing: 'easeOutElastic',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },

  // 胜利动画
  playerVictory(skeleton) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ loop: true });
    tl.add({ targets: { v: 0 }, v: -70, duration: 400, easing: 'easeOutBack',
      update: a => { skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: 0 }, v: -70, duration: 400, easing: 'easeOutBack',
      update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
    tl.add({ targets: { v: -70 }, v: -50, duration: 300, easing: 'easeInOutSine',
      update: a => {
        skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue });
        skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue });
      } });
    tl.add({ targets: { v: -50 }, v: -70, duration: 300, easing: 'easeInOutSine',
      update: a => {
        skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue });
        skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue });
      } });
    skeleton._idleTl = tl;
  },

  // 失败动画
  playerDefeat(skeleton) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline();
    tl.add({ targets: { v: 0 }, v: 45, duration: 800, easing: 'easeOutQuad',
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue, alpha: 0.4 }); } });
    tl.add({ targets: { v: 0 }, v: 20, duration: 800, easing: 'easeOutQuad',
      update: a => {
        skeleton.setBoneTransform('arm_upper_l', { rotation: a.animations[0].currentValue });
        skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue });
      } }, 0);
  },

  // 逃跑动画
  playerFlee(skeleton, startX, callback) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    tl.add({ targets: { v: 0 }, v: -10, duration: 200,
      update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: startX }, v: startX - 200, duration: 400, easing: 'easeInQuad',
      update: a => {
        const svg = skeleton.svg;
        if (svg) svg.style.transform = `translateX(${a.animations[0].currentValue - startX}px)`;
        if (svg) svg.style.opacity = Math.max(0, 1 - (a.progress / 100));
      } });
    tl.add({ targets: { v: 0 }, duration: 100,
      begin: () => { if (skeleton.svg) { skeleton.svg.style.transform = ''; skeleton.svg.style.opacity = '1'; } } });
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },

  // 敌人攻击动画
  enemyAttack(skeleton, callback) {
    if (skeleton._idleTl) skeleton._idleTl.pause();
    const tl = anime.timeline({ easing: 'easeOutExpo' });
    const skelType = skeleton.type || 'enemy';

    if (skelType === 'spirit') {
      // 灵体：核心闪烁 + 冲刺
      tl.add({ targets: { v: 0 }, v: 1.3, duration: 250,
        update: a => { skeleton.setBoneTransform('core', { scaleX: a.animations[0].currentValue, scaleY: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: -20, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('core', { y: -20 + a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 1.3 }, v: 1, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('core', { scaleX: a.animations[0].currentValue, scaleY: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: -20 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('core', { y: -20 + a.animations[0].currentValue }); } }, '-=350');
    } else if (skelType === 'humanoid') {
      // 人形：类似玩家攻击
      tl.add({ targets: { v: 0 }, v: -15, duration: 250,
        update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: -50, duration: 250,
        update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: -15 }, v: 12, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: -50 }, v: 70, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, '-=180');
      tl.add({ targets: { v: 12 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('torso', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 70 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('arm_upper_r', { rotation: a.animations[0].currentValue }); } }, '-=350');
    } else if (skelType === 'dragon') {
      // 龙族：蛇身前冲 + 头部咬击
      tl.add({ targets: { v: 0 }, v: -10, duration: 250,
        update: a => { skeleton.setBoneTransform('body_seg1', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: -20, duration: 250,
        update: a => { skeleton.setBoneTransform('head', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: 0 }, v: -15, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('jaw', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: -10 }, v: 15, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('body_seg1', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: -20 }, v: 20, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('head', { rotation: a.animations[0].currentValue }); } }, '-=180');
      tl.add({ targets: { v: 15 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('body_seg1', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 20 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('head', { rotation: a.animations[0].currentValue }); } }, '-=350');
      tl.add({ targets: { v: -15 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('jaw', { rotation: a.animations[0].currentValue }); } }, '-=350');
    } else {
      // beast (default) — 原有四足兽攻击
      tl.add({ targets: { v: 0 }, v: -8, duration: 250,
        update: a => { skeleton.setBoneTransform('body', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 0 }, v: -15, duration: 250,
        update: a => { skeleton.setBoneTransform('head', { rotation: a.animations[0].currentValue }); } }, 0);
      tl.add({ targets: { v: -8 }, v: 10, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('body', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: -15 }, v: 15, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('head', { rotation: a.animations[0].currentValue }); } }, '-=180');
      tl.add({ targets: { v: 0 }, v: -10, duration: 180, easing: 'easeInQuad',
        update: a => { skeleton.setBoneTransform('jaw', { rotation: a.animations[0].currentValue }); } }, '-=180');
      tl.add({ targets: { v: 10 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('body', { rotation: a.animations[0].currentValue }); } });
      tl.add({ targets: { v: 15 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('head', { rotation: a.animations[0].currentValue }); } }, '-=350');
      tl.add({ targets: { v: -10 }, v: 0, duration: 350, easing: 'easeOutQuad',
        update: a => { skeleton.setBoneTransform('jaw', { rotation: a.animations[0].currentValue }); } }, '-=350');
    }
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },

  // 敌人受击动画
  enemyHit(skeleton, callback) {
    const tl = anime.timeline({ easing: 'easeOutElastic' });
    const skelType = skeleton.type || 'enemy';
    const mainBone = skelType === 'spirit' ? 'core' : skelType === 'dragon' ? 'body_seg1' : skelType === 'humanoid' ? 'torso' : 'body';
    tl.add({ targets: { v: 0 }, v: -15, duration: 150,
      update: a => { skeleton.setBoneTransform(mainBone, { rotation: a.animations[0].currentValue }); } });
    tl.add({ targets: { v: -15 }, v: 0, duration: 500, easing: 'easeOutElastic',
      update: a => { skeleton.setBoneTransform(mainBone, { rotation: a.animations[0].currentValue }); } });
    if (callback) tl.finished.then(callback);
    return tl.finished;
  },
};

window.toggleSkillMenu = function() {
  // Cards are now always visible — no-op
};

// ============================================================
// 弹窗管理
// ============================================================
window.closeModal = function(id) {
  document.getElementById(id).classList.remove('active');
};

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// ============================================================
// 工具函数
// ============================================================
async function apiPost(endpoint, data) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error(`API ${endpoint} HTTP ${res.status}`);
      return { success: false, message: `服务器错误 (${res.status})` };
    }
    return await res.json();
  } catch (e) {
    console.error(`API 错误 ${endpoint}:`, e);
    if (e.name === 'AbortError') return { success: false, message: '请求超时' };
    return { success: false, message: '网络错误' };
  }
}

async function reloadCharacter() {
  try {
    console.log('[reload] fetching...');
    const res = await fetch(`${API}/load_character`);
    const data = await res.json();
    console.log('[reload] response:', data.success, 'exp:', data.character?.exp);
    if (data.success && data.character) {
      gameState.character = data.character;
      updateUI();
      console.log('[reload] UI updated, exp bar:', document.getElementById('expValue')?.textContent);
    } else {
      console.error('[reload] failed:', data.message);
    }
  } catch (e) {
    console.error('[reload] error:', e);
  }
}

function addLog(text, type = '') {
  const log = document.getElementById('gameLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = text;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function shakeInput(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.3s ease';
  setTimeout(() => el.style.animation = '', 300);
}

function disableActions(disabled) {
  console.log('[disableActions]', disabled);
  document.querySelectorAll('.seal-btn').forEach(btn => {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.4' : '1';
    btn.style.pointerEvents = disabled ? 'none' : 'auto';
  });
}

function playBreakthroughEffect() {
  // 朱砂金光突破效果
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle, rgba(184,150,62,0.4), rgba(194,59,34,0.2), transparent 70%);
    z-index: 999; pointer-events: none;
    animation: flashAnim 1.2s ease-out forwards;
  `;
  document.body.appendChild(flash);

  // 墨点飞溅
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('div');
    const angle = (Math.PI * 2 * i) / 12;
    const dist = 80 + Math.random() * 120;
    const size = 3 + Math.random() * 5;
    dot.style.cssText = `
      position: fixed;
      left: 50%; top: 50%;
      width: ${size}px; height: ${size}px;
      background: ${Math.random() > 0.5 ? 'var(--gold-bright)' : 'var(--cinnabar-bright)'};
      border-radius: 50%;
      pointer-events: none;
      z-index: 1000;
      animation: inkDot 0.8s ease-out forwards;
      --dx: ${Math.cos(angle) * dist}px;
      --dy: ${Math.sin(angle) * dist}px;
    `;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 800);
  }

  setTimeout(() => flash.remove(), 1200);
}

// ============================================================
// 墨迹背景画布 — 水墨山水
// ============================================================
// ============================================================
// 地图主题背景系统
// ============================================================
const REGION_THEMES = {
  "青云镇": {
    mountainColor: [200,195,185], mountainAlpha: 0.025,
    particleColors: ['184,150,62','200,195,185'],
    lineColor: '184,150,62', shape: 'gentle',
    special: null, bgTint: 'rgba(10,10,15,0)',
  },
  "翠竹林": {
    mountainColor: [100,160,100], mountainAlpha: 0.03,
    particleColors: ['90,158,143','150,200,150','80,140,80'],
    lineColor: '90,158,143', shape: 'bamboo',
    special: 'leaves', bgTint: 'rgba(20,40,20,0.03)',
  },
  "炎魔谷": {
    mountainColor: [180,80,40], mountainAlpha: 0.035,
    particleColors: ['200,80,30','255,150,50','180,60,20'],
    lineColor: '200,80,30', shape: 'jagged',
    special: 'sparks', bgTint: 'rgba(40,10,5,0.04)',
  },
  "幽冥涧": {
    mountainColor: [60,60,90], mountainAlpha: 0.02,
    particleColors: ['100,80,140','60,80,120','80,60,100'],
    lineColor: '100,80,140', shape: 'deep',
    special: 'wisps', bgTint: 'rgba(10,5,20,0.05)',
  },
  "天机城": {
    mountainColor: [160,140,120], mountainAlpha: 0.025,
    particleColors: ['200,160,80','180,150,100','160,130,80'],
    lineColor: '200,160,80', shape: 'city',
    special: 'lanterns', bgTint: 'rgba(20,15,10,0.02)',
  },
  "万妖山": {
    mountainColor: [140,100,60], mountainAlpha: 0.035,
    particleColors: ['180,120,60','120,80,40','160,100,50'],
    lineColor: '160,100,50', shape: 'jagged',
    special: 'sparks', bgTint: 'rgba(30,20,10,0.04)',
  },
  "星落海": {
    mountainColor: [60,100,160], mountainAlpha: 0.025,
    particleColors: ['80,140,200','100,160,220','60,120,180'],
    lineColor: '80,140,200', shape: 'deep',
    special: 'wisps', bgTint: 'rgba(10,20,40,0.04)',
  },
  "天玄域": {
    mountainColor: [180,160,100], mountainAlpha: 0.03,
    particleColors: ['220,180,60','200,160,80','180,140,60'],
    lineColor: '220,180,60', shape: 'gentle',
    special: 'lanterns', bgTint: 'rgba(20,15,5,0.03)',
  },
  "九幽地府": {
    mountainColor: [50,40,70], mountainAlpha: 0.02,
    particleColors: ['80,60,120','60,50,90','100,80,140'],
    lineColor: '80,60,120', shape: 'deep',
    special: 'wisps', bgTint: 'rgba(15,10,25,0.06)',
  },
  "混沌深渊": {
    mountainColor: [100,40,40], mountainAlpha: 0.03,
    particleColors: ['150,50,50','80,30,30','120,40,60'],
    lineColor: '150,50,50', shape: 'jagged',
    special: 'sparks', bgTint: 'rgba(30,10,10,0.05)',
  },
  "仙灵岛": {
    mountainColor: [80,160,120], mountainAlpha: 0.025,
    particleColors: ['100,200,150','120,180,140','80,160,120'],
    lineColor: '100,200,150', shape: 'bamboo',
    special: 'leaves', bgTint: 'rgba(15,30,20,0.03)',
  },
  "天劫荒原": {
    mountainColor: [140,120,80], mountainAlpha: 0.03,
    particleColors: ['200,180,100','160,140,80','180,160,60'],
    lineColor: '200,180,100', shape: 'jagged',
    special: 'sparks', bgTint: 'rgba(25,20,10,0.04)',
  },
  "飞升台": {
    mountainColor: [200,200,220], mountainAlpha: 0.02,
    particleColors: ['240,240,255','220,220,240','200,200,230'],
    lineColor: '240,240,255', shape: 'gentle',
    special: 'wisps', bgTint: 'rgba(20,20,30,0.02)',
  },
};

let bgAnimId = null;
let currentRegion = null;

function initInkCanvas() {
  drawRegionBackground('青云镇');
}

function drawRegionBackground(regionName) {
  if (currentRegion === regionName && bgAnimId) return;
  currentRegion = regionName;

  if (bgAnimId) { cancelAnimationFrame(bgAnimId); bgAnimId = null; }

  const canvas = document.getElementById('inkCanvas');
  const ctx = canvas.getContext('2d');
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const theme = REGION_THEMES[regionName] || REGION_THEMES['青云镇'];
  const mc = theme.mountainColor;

  // 山体轮廓
  const mountains = [];
  for (let layer = 0; layer < 3; layer++) {
    const pts = [];
    const segments = theme.shape === 'jagged' ? 12 + layer * 3 : 8 + layer * 4;
    const baseY = h * (0.55 + layer * 0.12);
    for (let i = 0; i <= segments; i++) {
      const x = (w / segments) * i;
      const peakH = (0.15 - layer * 0.03) * h;
      let y;
      if (theme.shape === 'jagged') {
        y = baseY - Math.random() * peakH * 1.3;
      } else if (theme.shape === 'bamboo') {
        y = baseY - Math.random() * peakH * (Math.sin(i * 1.2) * 0.7 + 0.3);
      } else if (theme.shape === 'deep') {
        y = baseY + layer * 20 - Math.random() * peakH * 0.6;
      } else if (theme.shape === 'city') {
        y = baseY - (Math.random() * 0.5 + 0.5) * peakH * 0.5;
      } else {
        y = baseY - Math.random() * peakH * (Math.sin(i * 0.8) * 0.5 + 0.5);
      }
      pts.push({ x, y });
    }
    mountains.push({ pts, alpha: theme.mountainAlpha - layer * 0.006, speed: 0.15 + layer * 0.05 });
  }

  // 粒子
  const particles = [];
  const particleCount = theme.special ? 60 : 50;
  for (let i = 0; i < particleCount; i++) {
    const colorIdx = Math.floor(Math.random() * theme.particleColors.length);
    particles.push({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.08 + 0.01,
      color: theme.particleColors[colorIdx],
    });
  }

  // 特殊粒子
  const specials = [];
  function addSpecial() {
    if (specials.length > 15) return;
    const s = { x: Math.random() * w, y: h * 0.3 + Math.random() * h * 0.5, life: 1 };
    if (theme.special === 'leaves') {
      s.type = 'leaf'; s.vx = -0.3 - Math.random() * 0.5; s.vy = 0.2 + Math.random() * 0.3;
      s.r = 2 + Math.random() * 3; s.rot = Math.random() * Math.PI; s.rotSpeed = 0.02 + Math.random() * 0.03;
    } else if (theme.special === 'sparks') {
      s.type = 'spark'; s.vx = (Math.random() - 0.5) * 0.5; s.vy = -0.5 - Math.random() * 0.8;
      s.r = 1 + Math.random() * 2; s.life = 0.5 + Math.random() * 0.5;
    } else if (theme.special === 'wisps') {
      s.type = 'wisp'; s.vx = (Math.random() - 0.5) * 0.1; s.vy = -0.1 - Math.random() * 0.2;
      s.r = 5 + Math.random() * 10; s.alpha = 0.02 + Math.random() * 0.03;
    } else if (theme.special === 'lanterns') {
      s.type = 'lantern'; s.vx = (Math.random() - 0.5) * 0.05; s.vy = -0.15 - Math.random() * 0.1;
      s.r = 3 + Math.random() * 4; s.glow = 0.03 + Math.random() * 0.04;
    }
    specials.push(s);
  }

  // 墨滴
  const inkDrops = [];
  function addInkDrop() {
    if (inkDrops.length > 5) return;
    inkDrops.push({
      x: Math.random() * w, y: Math.random() * h * 0.6,
      r: 0, maxR: 20 + Math.random() * 40,
      alpha: 0.03 + Math.random() * 0.02, speed: 0.3 + Math.random() * 0.3,
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    frame++;

    // 背景色调
    if (theme.bgTint !== 'rgba(10,10,15,0)') {
      ctx.fillStyle = theme.bgTint;
      ctx.fillRect(0, 0, w, h);
    }

    // 山体
    mountains.forEach((m) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      m.pts.forEach((p, i) => {
        const offsetX = Math.sin(frame * 0.003 * m.speed + i * 0.5) * 2;
        if (i === 0) ctx.lineTo(p.x, p.y + offsetX);
        else {
          const prev = m.pts[i - 1];
          const cpx = (prev.x + p.x) / 2;
          ctx.quadraticCurveTo(prev.x, prev.y + offsetX, cpx, (prev.y + p.y) / 2 + offsetX);
        }
      });
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = `rgba(${mc[0]},${mc[1]},${mc[2]}, ${m.alpha})`;
      ctx.fill();
    });

    // 普通粒子
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });

    // 特殊粒子
    if (theme.special && frame % 60 === 0) addSpecial();
    for (let i = specials.length - 1; i >= 0; i--) {
      const s = specials[i];
      s.x += s.vx; s.y += s.vy;
      s.life -= 0.003;
      if (s.life <= 0 || s.x < -20 || s.x > w + 20 || s.y < -20 || s.y > h + 20) {
        specials.splice(i, 1); continue;
      }
      if (s.type === 'leaf') {
        s.rot += s.rotSpeed;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = `rgba(80,150,60, ${s.life * 0.15})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, s.r * 2, s.r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (s.type === 'spark') {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,180,50, ${s.life * 0.4})`;
        ctx.fill();
      } else if (s.type === 'wisp') {
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
        grad.addColorStop(0, `rgba(120,100,180, ${s.alpha * s.life})`);
        grad.addColorStop(1, 'rgba(120,100,180, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.type === 'lantern') {
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        grad.addColorStop(0, `rgba(255,180,60, ${s.glow * s.life})`);
        grad.addColorStop(1, 'rgba(255,180,60, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,80, ${s.life * 0.3})`;
        ctx.fill();
      }
    }

    // 墨滴
    if (frame % 300 === 0) addInkDrop();
    for (let i = inkDrops.length - 1; i >= 0; i--) {
      const d = inkDrops[i];
      d.r += d.speed;
      if (d.r > d.maxR) { d.alpha -= 0.001; if (d.alpha <= 0) { inkDrops.splice(i, 1); continue; } }
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${mc[0]},${mc[1]},${mc[2]}, ${d.alpha})`;
      ctx.fill();
    }

    // 连线
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${theme.lineColor}, ${0.02 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }
    }

    bgAnimId = requestAnimationFrame(draw);
  }

  draw();
}

// ============================================================
// CSS 动画注入
// ============================================================
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
  @keyframes flashAnim {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes inkDot {
    0% { transform: translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
  }
  @keyframes inkSplashAnim {
    0% { transform: scale(0); opacity: 1; }
    100% { transform: scale(1); opacity: 0; }
  }
  @keyframes screenFadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes scrollRoll {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-30px) scale(0.95); }
  }
  .pulse {
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(122,90,138,0.3); }
    50% { box-shadow: 0 0 16px 4px rgba(122,90,138,0.15); }
  }
`;
document.head.appendChild(style);

// 初始化创建界面预览
updateCreationPreview();

// ============================================================
// Toast 通知系统
// ============================================================
// ============================================================
// 视觉特效函数
// ============================================================

function triggerAchievementFlash() {
  const gameScreen = document.getElementById('gameScreen');
  if (!gameScreen) return;

  gameScreen.classList.add('achievement-flash');
  setTimeout(() => gameScreen.classList.remove('achievement-flash'), 1000);
}

function flashStatBar(barId) {
  const bar = document.getElementById(barId);
  if (!bar) return;

  bar.classList.add('bar-flash');
  setTimeout(() => bar.classList.remove('bar-flash'), 600);
}


function updateComboCounter(isCrit) {
  const now = Date.now();

  if (now - gameState.combatLastHitTime < 2000) {
    gameState.combatCombo++;
  } else {
    gameState.combatCombo = 1;
  }
  gameState.combatLastHitTime = now;

  const combo = gameState.combatCombo;
  let dmgMult = 1.0;

  // 连击奖励
  if (combo >= 10) {
    dmgMult = 1.5;
  } else if (combo >= 5) {
    dmgMult = 1.25;
  } else if (combo >= 3) {
    dmgMult = 1.1;
  }

  clearTimeout(gameState.comboTimer);
  gameState.comboTimer = setTimeout(() => {
    gameState.combatCombo = 0;
  }, 2000);

  return dmgMult;
}








function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// 新手引导系统
// ============================================================
const TUTORIAL_STEPS = [
  {
    target: '.xuan-paper',
    text: '欢迎来到鬼谷修仙录！这是你的修炼日志，所有事件都会记录在这里。',
    position: 'left',
  },
  {
    target: '#btnCultivate',
    text: '点击「修炼」可以提升修为，修为满了就能突破境界。多灵根修炼更快！',
    position: 'top',
  },
  {
    target: '#btnExplore',
    text: '点击「探索」可以在当前区域冒险，遇到怪物、发现宝物、偶遇NPC。',
    position: 'top',
  },
  {
    target: '#btnBreakthrough',
    text: '修为足够时，这里会出现突破按钮。突破成功可以提升境界，变强！',
    position: 'top',
  },
  {
    target: '#btnNPC',
    text: '点击「交谈」可以和NPC对话，购买丹药、功法和技能。',
    position: 'top',
  },
  {
    target: '#btnMove',
    text: '点击「移动」可以前往其他区域，更强的区域有更强的敌人和更好的奖励。',
    position: 'top',
  },
  {
    target: '.bamboo-panel',
    text: '左侧是你的属性面板，灵根、属性、装备、技能都在这里查看。',
    position: 'right',
  },
  {
    target: null,
    text: '引导完成！开始你的修仙之旅吧。记住：先修炼，再探索，积累实力后突破！',
    position: 'center',
  },
];

let tutorialStep = 0;
let tutorialActive = false;

function startTutorial() {
  tutorialStep = 0;
  tutorialActive = true;
  const overlay = document.getElementById('tutorialOverlay');
  overlay.style.display = 'block';
  showTutorialStep();
}

function showTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStep];
  const highlight = document.getElementById('tutorialHighlight');
  const tooltip = document.getElementById('tutorialTooltip');
  const text = document.getElementById('tutorialText');
  const indicator = document.getElementById('tutorialStepIndicator');
  const nextBtn = document.getElementById('tutorialNext');

  // 步骤指示器
  indicator.innerHTML = TUTORIAL_STEPS.map((_, i) =>
    `<span class="dot${i === tutorialStep ? ' active' : i < tutorialStep ? ' done' : ''}"></span>`
  ).join('');

  text.textContent = step.text;
  nextBtn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? '开始修仙' : '下一步';

  if (step.target) {
    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      highlight.style.display = 'block';
      highlight.style.top = (rect.top - pad) + 'px';
      highlight.style.left = (rect.left - pad) + 'px';
      highlight.style.width = (rect.width + pad * 2) + 'px';
      highlight.style.height = (rect.height + pad * 2) + 'px';

      // 定位 tooltip
      const tooltipPad = 16;
      if (step.position === 'left') {
        tooltip.style.top = rect.top + 'px';
        tooltip.style.right = (window.innerWidth - rect.left + tooltipPad) + 'px';
        tooltip.style.left = 'auto';
      } else if (step.position === 'right') {
        tooltip.style.top = rect.top + 'px';
        tooltip.style.left = (rect.right + tooltipPad) + 'px';
        tooltip.style.right = 'auto';
      } else if (step.position === 'top') {
        tooltip.style.bottom = (window.innerHeight - rect.top + tooltipPad) + 'px';
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = 'auto';
      }
    }
  } else {
    highlight.style.display = 'none';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    tooltip.style.right = 'auto';
  }
}

function endTutorial() {
  tutorialActive = false;
  document.getElementById('tutorialOverlay').style.display = 'none';
  localStorage.setItem('xiuxian_tutorial_done', '1');
  showToast('引导完成，开始修仙！', 'success');
}

document.getElementById('tutorialNext').addEventListener('click', () => {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    endTutorial();
  } else {
    showTutorialStep();
  }
});

document.getElementById('tutorialSkip').addEventListener('click', endTutorial);

// ============================================================
// 战斗动画系统
// ============================================================
// ============================================================
// 全局互动UI增强
// ============================================================

// 按钮波纹效果
function addRipple(btn, e) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// 给所有印章按钮添加波纹
document.querySelectorAll('.seal-btn').forEach(btn => {
  btn.addEventListener('click', (e) => addRipple(btn, e));
});

// 墨溅效果（使用第一个定义，append到body的全屏版本）

// 属性变化动画
function animateStatChange(elementId, isUp) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove('stat-change-up', 'stat-change-down');
  void el.offsetWidth; // 触发重绘
  el.classList.add(isUp ? 'stat-change-up' : 'stat-change-down');
  setTimeout(() => el.classList.remove('stat-change-up', 'stat-change-down'), 500);
}

// 境界提升全屏特效
function playBreakthroughEffect(realmName) {
  const overlay = document.createElement('div');
  overlay.className = 'breakthrough-overlay';

  const text = document.createElement('div');
  text.className = 'breakthrough-text';
  text.textContent = realmName;
  overlay.appendChild(text);

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2500);
}

// 探索发现闪光
function playDiscoveryFlash() {
  const flash = document.createElement('div');
  flash.className = 'discovery-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 800);
}

// 修炼发光效果
function playCultivateGlow() {
  const paper = document.querySelector('.xuan-paper');
  if (paper) {
    paper.classList.add('cultivate-glow');
    setTimeout(() => paper.classList.remove('cultivate-glow'), 1000);
  }
}

// ============================================================
// 增强后的游戏操作（集成动画）
// ============================================================

const _originalDoCultivate = doCultivate;
doCultivate = async function() {
  playCultivateGlow();
  await _originalDoCultivate();
};

const _originalDoExplore = doExplore;
doExplore = async function() {
  playDiscoveryFlash();
  await _originalDoExplore();
};

// 拦截突破结果添加特效
const _originalShowBreakthrough = showBreakthrough;
showBreakthrough = async function() {
  await _originalShowBreakthrough();
};

// 增强 updateUI 添加属性变化检测
const _originalUpdateUI = updateUI;
let _lastStats = null;
updateUI = function() {
  const c = gameState.character;
  if (c && _lastStats) {
    if (c.stats.根骨 > _lastStats.gengu) animateStatChange('statGengu', true);
    if (c.stats.悟性 > _lastStats.wuxing) animateStatChange('statWuxing', true);
    if (c.stats.气运 > _lastStats.qiyun) animateStatChange('statQiyun', true);
    if (c.stats.魅力 > _lastStats.meili) animateStatChange('statMeili', true);
  }
  if (c) _lastStats = { gengu: c.stats.根骨, wuxing: c.stats.悟性, qiyun: c.stats.气运, meili: c.stats.魅力 };
  _originalUpdateUI();
};

// 检查是否需要启动教程
const _originalEnterGame = enterGame;
enterGame = function() {
  _originalEnterGame();
  if (!localStorage.getItem('xiuxian_tutorial_done')) {
    setTimeout(startTutorial, 800);
  }
};

// ============================================================
// 音频系统集成
// ============================================================
let audioInitialized = false;

async function initAudio() {
  if (audioInitialized) return;
  if (typeof audioManager !== 'undefined') {
    await audioManager.init();
    audioInitialized = true;
  }
}

// 用户交互时初始化音频
document.addEventListener('click', function initAudioOnClick() {
  initAudio();
  document.removeEventListener('click', initAudioOnClick);
}, { once: true });

// 音频控制按钮
function createAudioToggle() {
  const btn = document.createElement('button');
  btn.className = 'audio-toggle';
  btn.id = 'audioToggle';
  btn.innerHTML = '♪';
  btn.title = '开关音乐';
  btn.addEventListener('click', () => {
    if (typeof audioManager !== 'undefined') {
      audioManager.toggleMute();
      btn.classList.toggle('muted', audioManager.muted);
      btn.innerHTML = audioManager.muted ? '♪̸' : '♪';
    }
  });
  document.body.appendChild(btn);
}

// 在游戏操作中播放音效
function playSfx(name) {
  if (typeof audioManager !== 'undefined' && audioInitialized) {
    audioManager.playSfx(name);
  }
}

function playBgmForRegion(regionType) {
  if (typeof audioManager === 'undefined' || !audioInitialized) return;
  const bgmMap = {
    '和平': 'bgm_peaceful', 'peaceful': 'bgm_peaceful',
    '战斗': 'bgm_battle', 'battle': 'bgm_battle',
    '幽暗': 'bgm_dark', 'dark': 'bgm_dark',
    '庄严': 'bgm_majestic', 'majestic': 'bgm_majestic',
    '空灵': 'bgm_ethereal', 'ethereal': 'bgm_ethereal',
  };
  const bgm = bgmMap[regionType] || 'bgm_peaceful';
  audioManager.playBgm(bgm);
}

// ============================================================
// 宗门系统
// ============================================================
document.getElementById('btnSect').addEventListener('click', showSect);

async function showSect() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  playSfx('sfx_open');
  document.getElementById('sectModal').classList.add('active');
  document.getElementById('sectDetail').style.display = 'none';
  document.getElementById('sectInfo').style.display = 'block';
  await loadSectList();
}

async function loadSectList() {
  const res = await apiPost('/sect/list', { character: gameState.character });
  const listEl = document.getElementById('sectList');
  if (!res.success) {
    listEl.innerHTML = '<p class="empty-hint">加载失败</p>';
    return;
  }

  // Check if player is already in a sect
  const infoRes = await apiPost('/sect/info', { character: gameState.character });
  if (infoRes.success && infoRes.sect) {
    showSectDetail(infoRes.sect);
    return;
  }

  const sectIcons = { '天剑宗': '⚔️', '青木门': '🌿', '玄水宫': '🌊', '烈焰门': '🔥', '厚土宗': '🪨' };
  listEl.innerHTML = (res.sects || []).map(s => `
    <div class="sect-card" onclick="joinSect('${s.name}')">
      <div class="sect-card-icon">${sectIcons[s.name] || '🏯'}</div>
      <div class="sect-card-name">${s.name}</div>
      <div class="sect-card-desc">${s.desc || ''}</div>
    </div>
  `).join('');
}

async function joinSect(name) {
  const res = await apiPost('/sect/join', { character: gameState.character, sect_name: name });
  if (res.success) {
    addLog(`加入${name}！`, 'success');
    playSfx('sfx_item');
    showToast(`成功加入${name}`, 'success');
    await reloadCharacter();
    await loadSectList();
  } else {
    addLog(res.message || '加入失败', 'danger');
    showToast(res.message || '加入失败', 'danger');
  }
}

function showSectDetail(sect) {
  document.getElementById('sectInfo').style.display = 'none';
  document.getElementById('sectDetail').style.display = 'block';
  document.getElementById('sectName').textContent = sect.name;
  document.getElementById('sectRank').textContent = sect.rank || '外门弟子';
  document.getElementById('sectDesc').textContent = sect.desc || '';
  document.getElementById('sectStats').innerHTML = `
    <div class="sect-stat"><span class="sect-stat-label">等级</span><span class="sect-stat-val">${sect.level || 1}</span></div>
    <div class="sect-stat"><span class="sect-stat-label">成员</span><span class="sect-stat-val">${sect.member_count || 1}</span></div>
    <div class="sect-stat"><span class="sect-stat-label">贡献</span><span class="sect-stat-val">${sect.contribution || 0}</span></div>
  `;
  if (sect.members && sect.members.length) {
    document.getElementById('sectMembers').innerHTML = '<h4 style="color:var(--gold-dim);margin-bottom:8px;">成员</h4>' +
      sect.members.map(m => `<div class="sect-member"><span>${m.name}</span><span>${m.rank}</span></div>`).join('');
  }
  if (sect.tasks && sect.tasks.length) {
    document.getElementById('sectTasks').innerHTML = '<h4 style="color:var(--gold-dim);margin-bottom:8px;">宗门任务</h4>' +
      sect.tasks.map(t => `<div class="sect-task-item"><div class="sect-task-name">${t.name}</div><div class="sect-task-desc">${t.desc}</div></div>`).join('');
  }
}

document.getElementById('btnLeaveSect').addEventListener('click', async () => {
  if (!confirm('确定要退出宗门吗？')) return;
  const res = await apiPost('/sect/leave', { character: gameState.character });
  if (res.success) {
    addLog('已退出宗门', 'system');
    showToast('已退出宗门', 'info');
    await reloadCharacter();
    document.getElementById('sectDetail').style.display = 'none';
    document.getElementById('sectInfo').style.display = 'block';
    await loadSectList();
  }
});

document.getElementById('btnSectTask').addEventListener('click', async () => {
  const res = await apiPost('/sect/task', { character: gameState.character });
  if (res.success) {
    addLog(`接取宗门任务：${res.task_name}`, 'success');
    showToast(`接取任务：${res.task_name}`, 'success');
  } else {
    showToast(res.message || '接取失败', 'danger');
  }
});

// ============================================================
// 灵宠系统
// ============================================================
document.getElementById('btnPet').addEventListener('click', showPet);

async function showPet() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  playSfx('sfx_open');
  document.getElementById('petModal').classList.add('active');
  document.getElementById('petDetail').style.display = 'none';
  document.getElementById('petCatchArea').style.display = 'none';
  await loadPetList();
}

// Pet tab switching
document.querySelectorAll('.pet-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pet-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'list') {
      document.getElementById('petList').style.display = 'grid';
      document.getElementById('petCatchArea').style.display = 'none';
      document.getElementById('petDetail').style.display = 'none';
      loadPetList();
    } else {
      document.getElementById('petList').style.display = 'none';
      document.getElementById('petCatchArea').style.display = 'block';
      document.getElementById('petDetail').style.display = 'none';
      showWildPet();
    }
  });
});

async function loadPetList() {
  const res = await apiPost('/pet/list', { character: gameState.character });
  const listEl = document.getElementById('petList');
  if (!res.success || !res.pets || res.pets.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">还没有灵宠，去捕获一只吧！</p>';
    return;
  }
  const petIcons = { '灵狐': '🦊', '仙鹤': '🦢', '雷兽': '⚡', '火凤': '🔥', '玄龟': '🐢', '玉兔': '🐰', '金翅鹏': '🦅', '墨龙': '🐉' };
  listEl.innerHTML = res.pets.map((p, i) => `
    <div class="pet-card" onclick="showPetDetail(${i})">
      <div class="pet-card-icon">${petIcons[p.species] || '🐾'}</div>
      <div class="pet-card-name">${p.name}</div>
      <div class="pet-card-level">Lv.${p.level || 1} ${p.species || ''}</div>
    </div>
  `).join('');
}

let currentPets = [];
async function showPetDetail(index) {
  const res = await apiPost('/pet/list', { character: gameState.character });
  if (!res.success || !res.pets || !res.pets[index]) return;
  const pet = res.pets[index];
  currentPets = res.pets;

  document.getElementById('petList').style.display = 'none';
  document.getElementById('petDetail').style.display = 'block';

  const petIcons = { '灵狐': '🦊', '仙鹤': '🦢', '雷兽': '⚡', '火凤': '🔥', '玄龟': '🐢', '玉兔': '🐰', '金翅鹏': '🦅', '墨龙': '🐉' };
  document.getElementById('petAvatar').textContent = petIcons[pet.species] || '🐾';
  document.getElementById('petInfo').innerHTML = `
    <div class="pet-info-row"><span>名字</span><span>${pet.name}</span></div>
    <div class="pet-info-row"><span>种类</span><span>${pet.species || '未知'}</span></div>
    <div class="pet-info-row"><span>等级</span><span>Lv.${pet.level || 1}</span></div>
    <div class="pet-info-row"><span>亲密度</span><span>${pet.affinity || 0}</span></div>
    <div class="pet-info-row"><span>攻击</span><span>${pet.attack || 0}</span></div>
    <div class="pet-info-row"><span>防御</span><span>${pet.defense || 0}</span></div>
  `;
  if (pet.skills && pet.skills.length) {
    document.getElementById('petSkills').innerHTML = pet.skills.map(s => `<span class="pet-skill-tag">${s}</span>`).join('');
  }
}

document.getElementById('btnFeedPet').addEventListener('click', async () => {
  if (!currentPets.length) return;
  const pet = currentPets[0]; // Feed the first pet for simplicity
  const res = await apiPost('/pet/feed', { character: gameState.character, pet_name: pet.name });
  if (res.success) {
    addLog(`喂养${pet.name}成功，亲密度+${res.affinity_gain || 1}`, 'success');
    playSfx('sfx_item');
    showToast(`喂养成功`, 'success');
    await showPetDetail(0);
  } else {
    showToast(res.message || '喂养失败', 'danger');
  }
});

document.getElementById('btnEvolvePet').addEventListener('click', async () => {
  if (!currentPets.length) return;
  const pet = currentPets[0];
  const res = await apiPost('/pet/evolve', { character: gameState.character, pet_name: pet.name });
  if (res.success) {
    addLog(`${pet.name}进化成功！`, 'success');
    playSfx('sfx_breakthrough');
    showToast(`${pet.name}进化成功！`, 'success');
    await showPetDetail(0);
  } else {
    showToast(res.message || '进化失败', 'danger');
  }
});

document.getElementById('btnPetBattle').addEventListener('click', async () => {
  if (!currentPets.length) return;
  showToast('已设为出战灵宠', 'success');
});

async function showWildPet() {
  const wildPets = ['灵狐', '仙鹤', '雷兽', '火凤', '玄龟', '玉兔'];
  const randomPet = wildPets[Math.floor(Math.random() * wildPets.length)];
  const petIcons = { '灵狐': '🦊', '仙鹤': '🦢', '雷兽': '⚡', '火凤': '🔥', '玄龟': '🐢', '玉兔': '🐰' };
  document.getElementById('petWild').textContent = petIcons[randomPet] || '🐾';
  document.getElementById('petWild').dataset.petName = randomPet;
}

document.getElementById('btnCatchPet').addEventListener('click', async () => {
  const petName = document.getElementById('petWild').dataset.petName;
  if (!petName) return;
  playSfx('sfx_pet_catch');
  const res = await apiPost('/pet/catch', { character: gameState.character, pet_name: petName });
  if (res.success) {
    addLog(`成功捕获${petName}！`, 'success');
    showToast(`捕获${petName}成功！`, 'success');
    // Show a new wild pet
    showWildPet();
  } else {
    addLog(`${petName}逃脱了...`, 'system');
    showToast(`${petName}逃脱了`, 'warning');
    showWildPet();
  }
});

// ============================================================
// 秘境副本
// ============================================================
document.getElementById('btnDungeon').addEventListener('click', showDungeon);

async function showDungeon() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  playSfx('sfx_open');
  document.getElementById('dungeonModal').classList.add('active');
  document.getElementById('dungeonProgress').style.display = 'none';
  await loadDungeonList();
}

async function loadDungeonList() {
  const res = await apiPost('/dungeon/list', { character: gameState.character });
  const listEl = document.getElementById('dungeonList');
  if (!res.success || !res.dungeons || res.dungeons.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">暂无可用秘境</p>';
    return;
  }
  const dungeonIcons = ['🌀', '⛩️', '🏔️', '🌊', '🔥'];
  listEl.innerHTML = res.dungeons.map((d, i) => `
    <div class="dungeon-card" onclick="enterDungeon('${d.name}')">
      <div class="dungeon-card-icon">${dungeonIcons[i % dungeonIcons.length]}</div>
      <div class="dungeon-card-name">${d.name}</div>
      <div class="dungeon-card-info">
        推荐境界：${d.min_realm || '练气'}<br>
        层数：${d.floors || '?'}层<br>
        ${d.desc || ''}
      </div>
    </div>
  `).join('');
}

async function enterDungeon(name) {
  playSfx('sfx_dungeon_enter');
  const res = await apiPost('/dungeon/enter', { character: gameState.character, dungeon_name: name });
  if (res.success) {
    addLog(`进入秘境：${name}`, 'event');
    showToast(`进入${name}`, 'info');
    document.getElementById('dungeonList').style.display = 'none';
    document.getElementById('dungeonProgress').style.display = 'block';
    document.getElementById('dungeonFloor').textContent = res.floor || 1;
    if (res.hp_percent !== undefined) {
      document.getElementById('dungeonHpFill').style.width = res.hp_percent + '%';
    }
  } else {
    showToast(res.message || '进入失败', 'danger');
  }
}

document.getElementById('btnDungeonNext').addEventListener('click', async () => {
  const res = await apiPost('/dungeon/battle', { character: gameState.character });
  if (res.success) {
    addLog(`秘境战斗：${res.battle_desc || '遭遇敌人'}`, 'event');
    if (res.victory) {
      playSfx('sfx_victory');
      document.getElementById('dungeonFloor').textContent = res.floor || 1;
      if (res.hp_percent !== undefined) {
        document.getElementById('dungeonHpFill').style.width = res.hp_percent + '%';
      }
    } else {
      playSfx('sfx_defeat');
      addLog('秘境挑战失败...', 'danger');
    }
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
  } else {
    showToast(res.message || '战斗失败', 'danger');
  }
});

document.getElementById('btnDungeonReward').addEventListener('click', async () => {
  const res = await apiPost('/dungeon/reward', { character: gameState.character });
  if (res.success) {
    addLog(`获得秘境奖励：${res.rewards || '丰厚奖励'}`, 'success');
    playSfx('sfx_item');
    showToast('领取奖励成功', 'success');
    document.getElementById('dungeonProgress').style.display = 'none';
    document.getElementById('dungeonList').style.display = 'grid';
    await loadDungeonList();
    await reloadCharacter();
  } else {
    showToast(res.message || '领取失败', 'danger');
  }
});

document.getElementById('btnDungeonLeave').addEventListener('click', () => {
  document.getElementById('dungeonProgress').style.display = 'none';
  document.getElementById('dungeonList').style.display = 'grid';
  addLog('离开了秘境', 'system');
});

// ============================================================
// 世界BOSS
// ============================================================
document.getElementById('btnWorldBoss').addEventListener('click', showWorldBoss);

async function showWorldBoss() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  playSfx('sfx_open');
  document.getElementById('worldBossModal').classList.add('active');
  await loadWorldBoss();
}

async function loadWorldBoss() {
  const res = await apiPost('/world_boss/info', { character: gameState.character });
  if (res.success && res.boss) {
    document.getElementById('bossInfo').style.display = 'block';
    document.getElementById('bossEmpty').style.display = 'none';
    const bossIcons = { '天魔': '👹', '妖皇': '🐲', '混沌老祖': '👿' };
    document.getElementById('bossAvatar').textContent = bossIcons[res.boss.name] || '👹';
    document.getElementById('bossName').textContent = res.boss.name;
    const hpPct = res.boss.hp_percent || 100;
    document.getElementById('bossHpFill').style.width = hpPct + '%';
    document.getElementById('bossHpText').textContent = `${res.boss.current_hp || '?'}/${res.boss.max_hp || '?'}`;
    document.getElementById('bossDesc').textContent = res.boss.desc || '';
    if (res.rankings && res.rankings.length) {
      document.getElementById('bossRankings').innerHTML = '<div class="boss-rank-title">伤害排行</div>' +
        res.rankings.map((r, i) => `<div class="boss-rank-item"><span>${i+1}. ${r.name}</span><span>${r.damage}</span></div>`).join('');
    }
  } else {
    document.getElementById('bossInfo').style.display = 'none';
    document.getElementById('bossEmpty').style.display = 'block';
  }
}

document.getElementById('btnAttackBoss').addEventListener('click', async () => {
  playSfx('sfx_attack');
  const res = await apiPost('/world_boss/attack', { character: gameState.character });
  if (res.success) {
    addLog(`对BOSS造成${res.damage || 0}伤害！`, 'event');
    if (res.killed) {
      playSfx('sfx_victory');
      addLog('BOSS已被击杀！', 'success');
      showToast('BOSS击杀成功！', 'success');
    }
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
    await loadWorldBoss();
  } else {
    showToast(res.message || '挑战失败', 'danger');
  }
});

// ============================================================
// 装备强化
// ============================================================
document.getElementById('btnEnhance').addEventListener('click', showEnhance);

async function showEnhance() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  playSfx('sfx_open');
  document.getElementById('enhanceModal').classList.add('active');
  document.getElementById('enhancePanel').style.display = 'none';
  document.getElementById('gemPanel').style.display = 'none';
  await loadEnhanceEquipList();
}

// Enhance tab switching
document.querySelectorAll('.enhance-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.enhance-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'enhance') {
      document.getElementById('enhanceEquipSelect').style.display = 'block';
      document.getElementById('enhancePanel').style.display = 'none';
      document.getElementById('gemPanel').style.display = 'none';
      loadEnhanceEquipList();
    } else {
      document.getElementById('enhanceEquipSelect').style.display = 'none';
      document.getElementById('enhancePanel').style.display = 'none';
      document.getElementById('gemPanel').style.display = 'block';
      loadGemPanel();
    }
  });
});

async function loadEnhanceEquipList() {
  const charRes = await apiPost('/load_character', {});
  const char = charRes.character || gameState.character;
  const equipped = char.equipped || {};
  const items = [];
  if (equipped.weapon) items.push({ slot: 'weapon', name: equipped.weapon, icon: '⚔️' });
  if (equipped.armor) items.push({ slot: 'armor', name: equipped.armor, icon: '🛡️' });
  if (equipped.accessory) items.push({ slot: 'accessory', name: equipped.accessory, icon: '💍' });

  const listEl = document.getElementById('enhanceEquipList');
  if (items.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">没有可强化的装备</p>';
    return;
  }
  listEl.innerHTML = items.map(it => `
    <div class="enhance-equip-card" onclick="selectEnhanceEquip('${it.slot}', '${it.name}')">
      <div style="font-size:24px;margin-bottom:6px;">${it.icon}</div>
      <div class="enhance-equip-name">${it.name}</div>
      <div class="enhance-equip-level">${it.slot === 'weapon' ? '武器' : it.slot === 'armor' ? '护甲' : '饰品'}</div>
    </div>
  `).join('');
}

async function selectEnhanceEquip(slot, name) {
  document.getElementById('enhanceEquipSelect').style.display = 'none';
  document.getElementById('enhancePanel').style.display = 'block';
  document.getElementById('enhancePreview').innerHTML = `
    <div class="enhance-preview-name">${name}</div>
    <div class="enhance-preview-stats">点击强化提升装备属性</div>
  `;
  document.getElementById('enhanceCost').textContent = '消耗灵石进行强化';
}

document.getElementById('btnDoEnhance').addEventListener('click', async () => {
  playSfx('sfx_enhance');
  const res = await apiPost('/enhance/equip', { character: gameState.character });
  if (res.success) {
    addLog(`强化成功！${res.message || ''}`, 'success');
    playSfx('sfx_breakthrough');
    showToast('强化成功！', 'success');
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
  } else {
    playSfx('sfx_enhance_fail');
    addLog(res.message || '强化失败', 'danger');
    showToast(res.message || '强化失败', 'danger');
  }
});

async function loadGemPanel() {
  const gemIcons = { '攻击宝石': '🔴', '防御宝石': '🔵', '生命宝石': '🟢', '灵力宝石': '🟣', '暴击宝石': '🟡' };
  const listEl = document.getElementById('gemList');
  listEl.innerHTML = Object.entries(gemIcons).map(([name, icon]) => `
    <div class="gem-item" onclick="selectGem('${name}')">
      <span class="gem-icon">${icon}</span>
      <span class="gem-name">${name}</span>
    </div>
  `).join('');

  document.getElementById('gemSocket').innerHTML = `
    <div class="gem-slot">⚔️</div>
    <div class="gem-slot">🛡️</div>
    <div class="gem-slot">💍</div>
  `;
}

let selectedGem = null;
function selectGem(name) {
  selectedGem = name;
  document.querySelectorAll('.gem-item').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

document.getElementById('btnEmbedGem').addEventListener('click', async () => {
  if (!selectedGem) { showToast('请先选择宝石', 'warning'); return; }
  const res = await apiPost('/enhance/gem', { character: gameState.character, gem_name: selectedGem });
  if (res.success) {
    playSfx('sfx_enhance');
    addLog(`镶嵌${selectedGem}成功！`, 'success');
    showToast('镶嵌成功', 'success');
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
  } else {
    showToast(res.message || '镶嵌失败', 'danger');
  }
});

// ============================================================
// 拍卖行
// ============================================================
document.getElementById('btnAuction').addEventListener('click', showAuction);

async function showAuction() {
  if (!gameState.character) { addLog('请先创建角色', 'danger'); return; }
  playSfx('sfx_open');
  document.getElementById('auctionModal').classList.add('active');
  await loadAuctionList();
}

// Auction tab switching
document.querySelectorAll('.auction-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auction-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'browse') {
      document.getElementById('auctionBrowse').style.display = 'block';
      document.getElementById('auctionSell').style.display = 'none';
      loadAuctionList();
    } else {
      document.getElementById('auctionBrowse').style.display = 'none';
      document.getElementById('auctionSell').style.display = 'block';
      loadAuctionSellList();
    }
  });
});

async function loadAuctionList() {
  const res = await apiPost('/auction/list', { character: gameState.character });
  const listEl = document.getElementById('auctionList');
  if (!res.success || !res.items || res.items.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">拍卖行暂无物品</p>';
    return;
  }
  listEl.innerHTML = res.items.map((item, i) => `
    <div class="auction-item">
      <div class="auction-item-name">${item.name}</div>
      <div class="auction-item-price">起拍价：<span class="price-val">${item.price} 灵石</span></div>
      <button class="auction-item-btn" onclick="buyAuction(${i}, '${item.name}', ${item.price})">竞拍</button>
    </div>
  `).join('');
}

async function buyAuction(index, name, price) {
  const res = await apiPost('/auction/buy', { character: gameState.character, item_index: index });
  if (res.success) {
    addLog(`拍得${name}！`, 'success');
    playSfx('sfx_item');
    showToast(`成功拍得${name}`, 'success');
    if (res.summary) updateFromSummary(res.summary);
    await reloadCharacter();
    await loadAuctionList();
  } else {
    showToast(res.message || '竞拍失败', 'danger');
  }
}

document.getElementById('btnRefreshAuction').addEventListener('click', async () => {
  playSfx('sfx_click');
  await loadAuctionList();
  showToast('拍品已刷新', 'info');
});

async function loadAuctionSellList() {
  const charRes = await apiPost('/load_character', {});
  const char = charRes.character || gameState.character;
  const inv = char.inventory || [];
  const listEl = document.getElementById('auctionSellList');
  if (inv.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">背包空空如也</p>';
    return;
  }
  listEl.innerHTML = inv.map((item, i) => `
    <div class="auction-sell-item" onclick="sellAuction(${i}, '${item}')">
      <div style="font-size:20px;margin-bottom:4px;">📦</div>
      <div style="font-size:12px;color:var(--text-body);">${item}</div>
    </div>
  `).join('');
}

async function sellAuction(index, name) {
  const price = prompt(`设置${name}的售价（灵石）：`, '100');
  if (!price || isNaN(price)) return;
  const res = await apiPost('/auction/sell', { character: gameState.character, item_index: index, price: parseInt(price) });
  if (res.success) {
    addLog(`上架${name}，售价${price}灵石`, 'success');
    showToast('上架成功', 'success');
    await loadAuctionSellList();
  } else {
    showToast(res.message || '上架失败', 'danger');
  }
}

// ============================================================
// 音频集成到游戏操作
// ============================================================
const _origDoCultivate2 = doCultivate;
doCultivate = async function() {
  playSfx('sfx_click');
  await _origDoCultivate2();
};

const _origDoExplore2 = doExplore;
doExplore = async function() {
  playSfx('sfx_click');
  await _origDoExplore2();
};

const _origShowBreakthrough2 = showBreakthrough;
showBreakthrough = async function() {
  playSfx('sfx_open');
  await _origShowBreakthrough2();
};

const _origDoBreakthrough = typeof doBreakthrough !== 'undefined' ? doBreakthrough : null;
if (_origDoBreakthrough) {
  window.doBreakthrough = async function() {
    const result = await _origDoBreakthrough();
    // breakthrough sound is handled in the result display
    return result;
  };
}

// Initialize audio toggle button
createAudioToggle();
