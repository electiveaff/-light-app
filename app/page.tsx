"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

interface BlobColors {
  halo: RGB;       // blue-violet outer corona
  rim: RGB;        // red-orange boundary ring
  bodyOuter: RGB;  // darker outer body
  bodyInner: RGB;  // lighter mid body
  core: RGB;       // warm cream center
}

interface SceneDef {
  name: string;
  blobs: [BlobColors, BlobColors, BlobColors];
  sphere: { gradient: string; glow: string; glassInset?: string };
  panelColor: RGB;
}

interface SceneLightSettings {
  brightness: number;        // 0–100
  customHue: number;         // 0–360
  customSaturation: number;  // 0–100
}

interface LightSource {
  id: number;
  name: string;
  brightness: number; // 0–100 (global default)
  on: boolean;
  blobGroup: 0 | 1 | 2; // which blob group this lamp belongs to
  sceneSettings?: Partial<Record<number, SceneLightSettings>>; // per-scene overrides
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const c = (r: number, g: number, b: number): RGB => [r, g, b];

// ── Scene definitions ─────────────────────────────────────────────────────────
// Colors derived from Figma node analysis (Желтый / Фиолетовый / Красный blobs)
// halo = outer corona, rim = SCREEN glow, bodyOuter/Inner = body, core = bright center

const SCENES: SceneDef[] = [
  {
    name: "Красный",
    blobs: [
      // Blob 0 (лево, -20°): 1:1 Figma «Красный-2», после сдвига → пинк-маджента
      { halo: c(255,0,81),   rim: c(255,0,30),   bodyOuter: c(253,125,90), bodyInner: c(253,90,125), core: c(255,247,234) },
      // Blob 1 (низ, +30°): 1:1 Figma blob 2, после сдвига → оранжево-красный
      { halo: c(255,0,81),   rim: c(255,0,30),   bodyOuter: c(253,125,90), bodyInner: c(253,90,125), core: c(255,247,234) },
      // Blob 2 (верх, +8°): 1:1 Figma blob 1 (референс)
      { halo: c(255,0,81),   rim: c(255,0,30),   bodyOuter: c(253,125,90), bodyInner: c(253,90,125), core: c(255,247,234) },
    ],
    sphere: {
      gradient: [
        // Тёплый оранжевый блик — верхний левый (основной источник света)
        "radial-gradient(ellipse 42% 30% at 22% 20%, rgb(245,98,16) 0%, rgba(215,52,12,0.55) 45%, transparent 72%)",
        // Тёплый оранжево-красный — левый центр
        "radial-gradient(ellipse at 32% 48%, rgb(218,55,14) 0%, transparent 42%)",
        // Насыщенный красный — горячее ядро
        "radial-gradient(ellipse at 52% 52%, rgb(205,14,32) 0%, transparent 38%)",
        // Холодный малиново-красный — правый верх (тень)
        "radial-gradient(ellipse at 80% 18%, rgb(138,5,52) 0%, transparent 44%)",
        // Холодный тёмный — правый край (обратная сторона)
        "radial-gradient(ellipse 28% 55% at 90% 52%, rgb(105,4,44) 0%, transparent 60%)",
        // Тёплый оранжевый отсвет — низ левый (отражение)
        "radial-gradient(ellipse at 18% 78%, rgb(192,62,8) 0%, transparent 42%)",
        // Холодный красно-пурпурный — низ правый
        "radial-gradient(ellipse at 78% 80%, rgb(125,5,38) 0%, transparent 44%)",
        // База — глубокий тёмно-красный
        "rgb(110,8,22)",
      ].join(", "),
      glow: "0 0 18px 6px rgba(240,60,20,.22)",
    },
    panelColor: c(24,9,9),
  },
  {
    name: "Сияние",
    blobs: [
      // Blob 0: голубовато-зелёный
      { halo: c(0,80,110),   rim: c(40,200,210),  bodyOuter: c(20,160,175),  bodyInner: c(50,200,210),  core: c(180,240,248) },
      // Blob 1: сине-фиолетовый
      { halo: c(30,20,120),  rim: c(80,80,240),   bodyOuter: c(50,50,200),   bodyInner: c(90,80,230),   core: c(190,185,255) },
      // Blob 2: холодный фиолетовый
      { halo: c(60,0,120),   rim: c(140,60,240),  bodyOuter: c(100,20,200),  bodyInner: c(130,40,225),  core: c(210,175,255) },
    ],
    sphere: {
      gradient: [
        // Сияние: широкий мягкий блик левый верх — рассеянный как аурора, без резкой точки
        "radial-gradient(ellipse 42% 28% at 28% 26%, rgba(160,180,255,0.72) 0%, rgba(120,150,240,0.28) 55%, transparent 85%)",
        // Второй мягкий отсвет справа — бирюзовый
        "radial-gradient(ellipse 22% 16% at 72% 38%, rgba(100,220,230,0.45) 0%, transparent 70%)",
        // Бирюзовая полоса — диагональ слева-сверху к центру (завиток авроры)
        "radial-gradient(ellipse 70% 22% at 35% 42%, rgba(60,210,220,0.70) 0%, rgba(40,180,200,0.20) 60%, transparent 85%)",
        // Вторая бирюзовая полоса — правый низ
        "radial-gradient(ellipse 55% 18% at 65% 65%, rgba(80,200,215,0.55) 0%, transparent 75%)",
        // Фиолетовое пятно центр-право
        "radial-gradient(ellipse at 60% 38%, rgba(90,40,180,0.65) 0%, transparent 42%)",
        // Тёмный индиго центр (глубина)
        "radial-gradient(ellipse at 45% 50%, rgba(10,8,60,0.80) 0%, transparent 50%)",
        // Синий средний слой
        "radial-gradient(ellipse at 50% 50%, rgba(25,40,140,0.90) 0%, transparent 72%)",
        // Мягкая виньетка по краю
        "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 52%, rgba(0,0,0,0.22) 100%)",
        // Тёмно-синяя база
        "rgb(5,6,28)",
      ].join(", "),
      glow: "0 0 16px 5px rgba(60,80,220,.32)",
      glassInset: "inset 0 1px 4px rgba(255,255,255,0.20), inset 0 -2px 5px rgba(0,200,140,0.15)",
    },
    panelColor: c(2,8,18),
  },
  {
    name: "Рассвет",
    blobs: [
      { halo: c(200,175,80),  rim: c(255,245,190), bodyOuter: c(255,248,210), bodyInner: c(255,254,243), core: c(255,255,252) },
      { halo: c(188,55,52),  rim: c(255,148,105), bodyOuter: c(242,118,88), bodyInner: c(255,219,202), core: c(255,247,242) },
      { halo: c(80,140,200),  rim: c(200,228,255), bodyOuter: c(120,180,240), bodyInner: c(211,233,252), core: c(248,252,255) },
    ],
    sphere: {
      gradient: [
        // Основной блик — яркий белый овал верхний левый
        "radial-gradient(ellipse 32% 20% at 28% 22%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.45) 45%, transparent 80%)",
        // Вторичный блик — мягкий снизу-справа (отражённый свет)
        "radial-gradient(ellipse 24% 14% at 72% 78%, rgba(255,248,235,0.72) 0%, transparent 70%)",
        // Rimlight — белое кольцо по краю (выпуклость)
        "radial-gradient(ellipse 92% 92% at 50% 50%, transparent 72%, rgba(255,255,255,0.28) 85%, rgba(255,255,255,0.05) 95%)",
        // Горизонт — белое свечение по центру
        "radial-gradient(ellipse 100% 28% at 50% 52%, rgba(255,255,255,0.90) 0%, rgba(255,245,215,0.50) 45%, transparent 70%)",
        // Голубое небо сверху
        "radial-gradient(ellipse at 50% 0%, rgba(165,210,250,0.92) 0%, rgba(200,228,255,0.60) 50%, transparent 75%)",
        // Лёгкий голубой туман
        "radial-gradient(ellipse at 50% 28%, rgba(195,222,252,0.55) 0%, transparent 52%)",
        // Тёплый золотистый левый край
        "radial-gradient(ellipse at 8% 58%, rgba(255,175,55,0.88) 0%, transparent 42%)",
        // Тёплый оранжевый правый край
        "radial-gradient(ellipse at 92% 58%, rgba(242,108,42,0.85) 0%, transparent 42%)",
        // Персиковый низ
        "radial-gradient(ellipse at 50% 92%, rgba(255,182,100,0.80) 0%, transparent 45%)",
        // Светло-голубая база
        "rgb(205,228,252)",
      ].join(", "),
      glow: "0 0 16px 5px rgba(255,180,60,.20)",
      glassInset: "inset 0 1px 4px rgba(255,255,255,0.22), inset 0 -2px 5px rgba(255,240,200,0.18)",
    },
    panelColor: c(16,12,3),
  },
  {
    name: "Лес",
    blobs: [
      { halo: c(8,38,115),   rim: c(12,130,55),  bodyOuter: c(16,158,68),  bodyInner: c(38,210,98),  core: c(178,252,198) },
      { halo: c(6,30,95),    rim: c(10,108,45),  bodyOuter: c(14,138,58),  bodyInner: c(32,182,78),  core: c(158,242,178) },
      { halo: c(10,48,128),  rim: c(16,150,78),  bodyOuter: c(22,178,88),  bodyInner: c(48,218,118), core: c(188,252,208) },
    ],
    sphere: {
      gradient: [
        // Главный яркий блик — белый, правее центра вверху (мокрое стекло)
        "radial-gradient(ellipse 22% 16% at 62% 22%, rgba(255,255,255,0.96) 0%, rgba(220,255,230,0.55) 40%, transparent 78%)",
        // Вторичный блик левее — серебристо-зелёный
        "radial-gradient(ellipse 14% 10% at 34% 30%, rgba(200,245,210,0.72) 0%, transparent 70%)",
        // Маленький блик нижний правый
        "radial-gradient(ellipse 10% 7% at 74% 70%, rgba(180,240,195,0.60) 0%, transparent 65%)",
        // Лаймово-жёлтый патч — внутреннее свечение центр-лево
        "radial-gradient(ellipse 45% 38% at 36% 52%, rgba(130,200,40,0.62) 0%, rgba(80,160,20,0.20) 55%, transparent 80%)",
        // Насыщенный изумруд правый
        "radial-gradient(ellipse at 68% 48%, rgba(20,160,60,0.70) 0%, transparent 45%)",
        // Тёмная тень слева вверху (вогнутость)
        "radial-gradient(ellipse 38% 30% at 22% 36%, rgba(4,28,10,0.80) 0%, transparent 65%)",
        // Тёмный провал центр
        "radial-gradient(ellipse 30% 26% at 50% 50%, rgba(6,35,14,0.75) 0%, transparent 55%)",
        // Тёмная тень низ-право
        "radial-gradient(ellipse at 72% 75%, rgba(4,22,8,0.70) 0%, transparent 40%)",
        // Мягкая виньетка по краю
        "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 52%, rgba(0,0,0,0.22) 100%)",
        // Тёмно-зелёная база
        "rgb(6,22,8)",
      ].join(", "),
      glow: "0 0 16px 5px rgba(40,160,60,.25)",
      glassInset: "inset 0 1px 4px rgba(255,255,255,0.28), inset 0 -2px 5px rgba(38,180,78,0.12)",
    },
    panelColor: c(4,10,6),
  },
  {
    name: "Закат",
    blobs: [
      { halo: c(72,14,148),  rim: c(255,92,10),  bodyOuter: c(200,68,15),  bodyInner: c(255,212,150), core: c(255,251,225) },
      { halo: c(65,10,132),  rim: c(248,78,10),  bodyOuter: c(182,55,12),  bodyInner: c(252,202,147), core: c(255,247,219) },
      { halo: c(82,18,162),  rim: c(255,112,18), bodyOuter: c(218,88,18),  bodyInner: c(255,227,157), core: c(255,255,230) },
    ],
    sphere: {
      gradient: "radial-gradient(circle at 50% 42%, rgba(255,242,185,.97) 0%, rgba(255,148,38,.92) 28%, rgba(210,60,18,.88) 56%, rgba(82,14,100,.90) 80%, rgba(40,6,55,.94) 100%)",
      glow: "0 0 16px 5px rgba(255,118,28,.19)",
    },
    panelColor: c(18,10,4),
  },
];

const N = SCENES.length;
const posToIdx = (p: number) => ((p % N) + N) % N;

const W = 402;
const H = 874;

// ── CSS blob layers ───────────────────────────────────────────────────────────

interface CL {
  x: number; y: number; w: number; h: number;
  blur: number; blend?: string; op?: number; bg: string;
}

// Красный — exact from Figma node 38-108
const KRASNY: CL[] = [
  // Group 1 (top, blobGroup 2) — fog=255,0,80 / screen→purple / body=red-orange
  { x:66,  y:48,  w:381, h:422, blur:90,  blend:'lighten', op:0.22, bg:'rgb(255,0,80)' },
  { x:151, y:211, w:140, h:155, blur:51,  bg:'radial-gradient(circle, rgb(255,80,10) 0%, rgba(255,0,80,0) 100%)' },
  { x:170, y:206, w:164, h:178, blur:37,  blend:'color',   bg:'radial-gradient(circle, rgb(255,216,197) 0%, rgba(255,253,180,0.65) 100%)' },
  { x:102, y:115, w:226, h:248, blur:60,  blend:'screen',  bg:'radial-gradient(circle, rgb(255,0,4) 0%, rgba(191,8,188,0.7) 100%)' },
  { x:151, y:143, w:210, h:233, blur:60,  blend:'lighten', bg:'rgb(255,0,80)' },
  { x:182, y:211, w:131, h:142, blur:59,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(255,0,4) 0%, rgba(255,238,155,0.65) 100%)' },
  { x:174, y:186, w:131, h:142, blur:59,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(255,80,10) 0%, rgba(255,238,155,0.65) 100%)' },
  // Group 1 core
  { x:163, y:188, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,238,155) 0%, rgba(255,0,4,0) 100%)' },
  { x:195, y:220, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,245,200,0) 100%)' },
  // Group 2 (bottom-right, blobGroup 1) — fog=255,63,0 / screen→orange / body=salmon
  { x:244, y:434, w:140, h:155, blur:38,  bg:'radial-gradient(circle, rgb(255,149,96) 0%, rgba(255,63,0,0) 100%)' },
  { x:201, y:415, w:164, h:178, blur:28,  blend:'color',   bg:'radial-gradient(circle, rgb(255,216,197) 0%, rgba(255,253,180,0.65) 100%)' },
  { x:208, y:436, w:226, h:248, blur:45,  blend:'screen',  bg:'radial-gradient(circle, rgb(255,0,4) 0%, rgba(255,114,0,0.7) 100%)' },
  { x:173, y:423, w:210, h:233, blur:45,  blend:'lighten', bg:'rgb(255,63,0)' },
  { x:222, y:446, w:131, h:142, blur:44,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(255,0,4) 0%, rgba(255,238,155,0.65) 100%)' },
  { x:230, y:470, w:131, h:142, blur:44,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(255,149,96) 0%, rgba(255,238,155,0.65) 100%)' },
  { x:230, y:454, w:131, h:142, blur:44,  blend:'luminosity',  bg:'radial-gradient(circle, rgb(255,149,96) 0%, rgba(255,238,155,0.65) 100%)' },
  { x:264, y:474, w:66,  h:74,  blur:33,  blend:'lighten', op:0.5, bg:'rgb(255,246,233)' },
  // Group 2 core
  { x:220, y:465, w:130, h:130, blur:24,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,238,155) 0%, rgba(255,0,4,0) 100%)' },
  { x:252, y:497, w:65,  h:65,  blur:11,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,245,200,0) 100%)' },
  // Group 3 (left, blobGroup 0) — fog=255,0,80 / screen→magenta / body=peach
  { x:-13, y:273, w:255, h:287, blur:95,  blend:'lighten', op:0.35, bg:'radial-gradient(circle, rgb(255,0,80) 0%, rgb(45,11,54) 100%)' },
  { x:77,  y:367, w:121, h:139, blur:33,  blend:'color',   bg:'radial-gradient(circle, rgb(255,216,197) 0%, rgba(255,253,180,0.65) 100%)' },
  { x:35,  y:327, w:160, h:177, blur:54,  blend:'lighten', bg:'rgb(255,0,80)' },
  { x:78,  y:382, w:97,  h:111, blur:52,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(255,0,80) 0%, rgba(255,238,155,0.65) 100%)' },
  { x:57,  y:384, w:97,  h:111, blur:52,  blend:'screen',      op:0.5, bg:'radial-gradient(circle, rgb(255,0,80) 0%, rgba(255,0,199,0.7) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(255,191,160) 0%, rgba(255,238,155,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(255,191,160) 0%, rgba(255,238,155,0.65) 100%)' },
  { x:87,  y:382, w:66,  h:74,  blur:44,  blend:'lighten', op:0.5, bg:'rgb(255,191,160)' },
  // Group 3 core
  { x:55,  y:358, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,238,155) 0%, rgba(255,0,80,0) 100%)' },
  { x:87,  y:390, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,245,200,0) 100%)' },
];

// Закат — same positions/structure as KRASNY, sunset palette, 1 color per source
const ZAKATY: CL[] = [
  // Group 1 (top) — orange-amber, single hue
  { x:66,  y:48,  w:381, h:422, blur:90,  blend:'lighten', op:0.22, bg:'rgb(255,155,15)' },
  { x:151, y:211, w:140, h:155, blur:51,  bg:'radial-gradient(circle, rgb(255,182,45) 0%, rgba(255,155,15,0) 100%)' },
  { x:170, y:206, w:164, h:178, blur:37,  blend:'color',   bg:'radial-gradient(circle, rgb(255,205,95) 0%, rgba(255,180,60,0.65) 100%)' },
  { x:102, y:115, w:226, h:248, blur:60,  blend:'screen',  bg:'radial-gradient(circle, rgb(255,155,15) 0%, rgba(200,95,5,0.7) 100%)' },
  { x:151, y:143, w:210, h:233, blur:60,  blend:'lighten', bg:'rgb(255,155,15)' },
  { x:182, y:211, w:131, h:142, blur:59,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(255,155,15) 0%, rgba(255,215,115,0.65) 100%)' },
  { x:174, y:186, w:131, h:142, blur:59,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(255,172,40) 0%, rgba(255,215,115,0.65) 100%)' },
  // Group 1 core — bright orange-gold + warm white
  { x:163, y:188, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,225,130) 0%, rgba(255,155,10,0) 100%)' },
  { x:195, y:220, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,250,230) 0%, rgba(255,220,150,0) 100%)' },
  // Group 2 (bottom-right) — orange-red, single hue
  { x:244, y:434, w:140, h:155, blur:38,  bg:'radial-gradient(circle, rgb(255,120,50) 0%, rgba(255,75,15,0) 100%)' },
  { x:201, y:415, w:164, h:178, blur:28,  blend:'color',   bg:'radial-gradient(circle, rgb(255,185,130) 0%, rgba(255,150,70,0.65) 100%)' },
  { x:208, y:436, w:226, h:248, blur:45,  blend:'screen',  bg:'radial-gradient(circle, rgb(255,75,15) 0%, rgba(200,40,5,0.7) 100%)' },
  { x:173, y:423, w:210, h:233, blur:45,  blend:'lighten', bg:'rgb(255,75,15)' },
  { x:222, y:446, w:131, h:142, blur:44,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(255,75,15) 0%, rgba(255,195,110,0.65) 100%)' },
  { x:230, y:470, w:131, h:142, blur:44,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(255,130,65) 0%, rgba(255,195,110,0.65) 100%)' },
  { x:230, y:454, w:131, h:142, blur:44,  blend:'luminosity',  bg:'radial-gradient(circle, rgb(255,130,65) 0%, rgba(255,195,110,0.65) 100%)' },
  { x:264, y:474, w:66,  h:74,  blur:33,  blend:'lighten', op:0.5, bg:'rgb(255,215,155)' },
  // Group 2 core — orange-gold + warm white
  { x:220, y:465, w:130, h:130, blur:24,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,200,100) 0%, rgba(255,75,10,0) 100%)' },
  { x:252, y:497, w:65,  h:65,  blur:11,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,248,235) 0%, rgba(255,225,175,0) 100%)' },
  // Group 3 (left) — deep violet, single hue
  { x:-13, y:273, w:255, h:287, blur:95,  blend:'lighten', op:0.35, bg:'radial-gradient(circle, rgb(80,15,120) 0%, rgb(20,5,40) 100%)' },
  { x:77,  y:367, w:121, h:139, blur:33,  blend:'color',   bg:'radial-gradient(circle, rgb(130,30,180) 0%, rgba(80,15,130,0.65) 100%)' },
  { x:35,  y:327, w:160, h:177, blur:54,  blend:'lighten', bg:'rgb(80,15,120)' },
  { x:78,  y:382, w:97,  h:111, blur:52,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(130,30,200) 0%, rgba(60,5,120,0.65) 100%)' },
  { x:57,  y:384, w:97,  h:111, blur:52,  blend:'hue',         op:0.5, bg:'radial-gradient(circle, rgb(235,80,210) 0%, rgba(255,160,220,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(140,50,200) 0%, rgba(200,160,255,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(140,50,200) 0%, rgba(200,160,255,0.65) 100%)' },
  { x:87,  y:382, w:66,  h:74,  blur:44,  blend:'lighten', op:0.5, bg:'rgb(230,100,210)' },
  // Group 3 core — bright violet-pink + near-white rose
  { x:55,  y:358, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(235,140,230) 0%, rgba(100,20,180,0) 100%)' },
  { x:87,  y:390, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,215,245) 0%, rgba(220,200,255,0) 100%)' },
];

// Рассвет — same positions/structure as KRASNY, tender dawn palette desaturated ×0.6, 1 color per source
const RASSVET: CL[] = [
  // Group 1 (top) — honey-cream sun, desaturated gold
  { x:66,  y:48,  w:381, h:422, blur:90,  blend:'lighten', op:0.20, bg:'rgb(243,225,146)' },
  { x:151, y:211, w:140, h:155, blur:51,  bg:'radial-gradient(circle, rgb(240,216,128) 0%, rgba(230,205,100,0) 100%)' },
  { x:170, y:206, w:164, h:178, blur:37,  blend:'color',   bg:'radial-gradient(circle, rgb(251,247,218) 0%, rgba(248,236,189,0.65) 100%)' },
  { x:102, y:115, w:226, h:248, blur:60,  blend:'screen',  bg:'radial-gradient(circle, rgb(239,215,113) 0%, rgba(178,149,59,0.7) 100%)' },
  { x:151, y:143, w:210, h:233, blur:60,  blend:'lighten', bg:'rgb(238,219,130)' },
  { x:182, y:211, w:131, h:142, blur:59,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(239,215,113) 0%, rgba(250,246,208,0.65) 100%)' },
  { x:174, y:186, w:131, h:142, blur:59,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(241,222,166) 0%, rgba(249,241,204,0.65) 100%)' },
  // Group 1 core — muted warm gold + near-white cream
  { x:163, y:188, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(252,250,216) 0%, rgba(240,224,132,0) 100%)' },
  { x:195, y:220, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,255,248) 0%, rgba(250,245,225,0) 100%)' },
  // Group 2 (bottom-right) — muted rose-peach horizon
  { x:244, y:434, w:140, h:155, blur:38,  bg:'radial-gradient(circle, rgb(226,168,144) 0%, rgba(212,124,100,0) 100%)' },
  { x:201, y:415, w:164, h:178, blur:28,  blend:'color',   bg:'radial-gradient(circle, rgb(240,210,198) 0%, rgba(232,186,172,0.65) 100%)' },
  { x:208, y:436, w:226, h:248, blur:45,  blend:'screen',  bg:'radial-gradient(circle, rgb(215,132,108) 0%, rgba(171,81,60,0.7) 100%)' },
  { x:173, y:423, w:210, h:233, blur:45,  blend:'lighten', bg:'rgb(217,141,115)' },
  { x:222, y:446, w:131, h:142, blur:44,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(215,132,108) 0%, rgba(237,201,185,0.65) 100%)' },
  { x:230, y:470, w:131, h:142, blur:44,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(227,172,151) 0%, rgba(237,201,185,0.65) 100%)' },
  { x:230, y:454, w:131, h:142, blur:44,  blend:'luminosity',  bg:'radial-gradient(circle, rgb(227,172,151) 0%, rgba(237,201,185,0.65) 100%)' },
  { x:264, y:474, w:66,  h:74,  blur:33,  blend:'lighten', op:0.5, bg:'rgb(249,237,228)' },
  // Group 2 core — muted blush + near-white
  { x:220, y:465, w:130, h:130, blur:24,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(247,230,218) 0%, rgba(218,143,119,0) 100%)' },
  { x:252, y:497, w:65,  h:65,  blur:11,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(255,250,246) 0%, rgba(246,228,219,0) 100%)' },
  // Group 3 (left) — muted slate-blue sky
  { x:-13, y:273, w:255, h:287, blur:95,  blend:'lighten', op:0.28, bg:'radial-gradient(circle, rgb(122,163,209) 0%, rgb(32,47,75) 100%)' },
  { x:77,  y:367, w:121, h:139, blur:33,  blend:'color',   bg:'radial-gradient(circle, rgb(173,206,233) 0%, rgba(139,177,215,0.65) 100%)' },
  { x:35,  y:327, w:160, h:177, blur:54,  blend:'lighten', bg:'rgb(120,161,209)' },
  { x:78,  y:382, w:97,  h:111, blur:52,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(141,183,223) 0%, rgba(97,135,193,0.65) 100%)' },
  { x:57,  y:384, w:97,  h:111, blur:52,  blend:'hue',         op:0.5, bg:'radial-gradient(circle, rgb(198,222,240) 0%, rgba(224,236,247,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(149,187,223) 0%, rgba(205,225,241,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(149,187,223) 0%, rgba(205,225,241,0.65) 100%)' },
  { x:87,  y:382, w:66,  h:74,  blur:44,  blend:'lighten', op:0.5, bg:'rgb(197,219,239)' },
  // Group 3 core — muted sky blue + near-white cool
  { x:55,  y:358, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(214,230,244) 0%, rgba(112,157,207,0) 100%)' },
  { x:87,  y:390, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(242,250,255) 0%, rgba(222,236,246,0) 100%)' },
];

// Лес — same positions/structure as KRASNY; Group 1 emerald, Group 2 forest, Group 3 grassy yellow-green
const LES: CL[] = [
  // Group 1 (top) — vivid emerald green
  { x:66,  y:48,  w:381, h:422, blur:90,  blend:'lighten', op:0.22, bg:'rgb(10,190,70)' },
  { x:151, y:211, w:140, h:155, blur:51,  bg:'radial-gradient(circle, rgb(30,200,85) 0%, rgba(8,170,55,0) 100%)' },
  { x:170, y:206, w:164, h:178, blur:37,  blend:'color',   bg:'radial-gradient(circle, rgb(175,252,200) 0%, rgba(155,248,185,0.65) 100%)' },
  { x:102, y:115, w:226, h:248, blur:60,  blend:'screen',  bg:'radial-gradient(circle, rgb(10,190,70) 0%, rgba(0,100,30,0.7) 100%)' },
  { x:151, y:143, w:210, h:233, blur:60,  blend:'lighten', bg:'rgb(10,190,70)' },
  { x:182, y:211, w:131, h:142, blur:59,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(10,190,70) 0%, rgba(178,255,205,0.65) 100%)' },
  { x:174, y:186, w:131, h:142, blur:59,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(30,200,85) 0%, rgba(178,255,205,0.65) 100%)' },
  // Group 1 core — emerald-white, slightly dimmed
  { x:163, y:188, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(165,248,195) 0%, rgba(10,190,70,0) 100%)' },
  { x:195, y:220, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(218,252,228) 0%, rgba(165,245,195,0) 100%)' },
  // Group 2 (bottom-right) — dark grassy green, muted
  { x:244, y:434, w:140, h:155, blur:38,  bg:'radial-gradient(circle, rgb(38,120,28) 0%, rgba(20,88,12,0) 100%)' },
  { x:201, y:415, w:164, h:178, blur:28,  blend:'color',   bg:'radial-gradient(circle, rgb(120,195,100) 0%, rgba(95,168,75,0.65) 100%)' },
  { x:208, y:436, w:226, h:248, blur:45,  blend:'screen',  bg:'radial-gradient(circle, rgb(38,120,28) 0%, rgba(12,55,8,0.7) 100%)' },
  { x:173, y:423, w:210, h:233, blur:45,  blend:'lighten', bg:'rgb(32,108,22)' },
  { x:222, y:446, w:131, h:142, blur:44,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(38,120,28) 0%, rgba(120,195,105,0.65) 100%)' },
  { x:230, y:470, w:131, h:142, blur:44,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(55,135,38) 0%, rgba(120,195,105,0.65) 100%)' },
  { x:230, y:454, w:131, h:142, blur:44,  blend:'luminosity',  bg:'radial-gradient(circle, rgb(55,135,38) 0%, rgba(120,195,105,0.65) 100%)' },
  { x:264, y:474, w:66,  h:74,  blur:33,  blend:'lighten', op:0.5, bg:'rgb(130,195,115)' },
  // Group 2 core — dark grassy, 50% dimmer than Group 1
  { x:220, y:465, w:130, h:130, blur:24,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(108,175,90) 0%, rgba(32,110,22,0) 100%)' },
  { x:252, y:497, w:65,  h:65,  blur:11,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(162,215,148) 0%, rgba(108,175,90,0) 100%)' },
  // Group 3 (left) — natural grassy yellow-green
  { x:-13, y:273, w:255, h:287, blur:95,  blend:'lighten', op:0.35, bg:'radial-gradient(circle, rgb(105,185,35) 0%, rgb(22,48,8) 100%)' },
  { x:77,  y:367, w:121, h:139, blur:33,  blend:'color',   bg:'radial-gradient(circle, rgb(165,228,80) 0%, rgba(135,205,42,0.65) 100%)' },
  { x:35,  y:327, w:160, h:177, blur:54,  blend:'lighten', bg:'rgb(105,185,35)' },
  { x:78,  y:382, w:97,  h:111, blur:52,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(120,195,40) 0%, rgba(85,155,18,0.65) 100%)' },
  { x:57,  y:384, w:97,  h:111, blur:52,  blend:'hue',         op:0.5, bg:'radial-gradient(circle, rgb(190,228,120) 0%, rgba(215,240,170,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(128,198,45) 0%, rgba(200,232,145,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(128,198,45) 0%, rgba(200,232,145,0.65) 100%)' },
  { x:87,  y:382, w:66,  h:74,  blur:44,  blend:'lighten', op:0.5, bg:'rgb(195,240,120)' },
  // Group 3 core — grassy yellow-white, slightly dimmed
  { x:55,  y:358, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(205,242,140) 0%, rgba(100,185,30,0) 100%)' },
  { x:87,  y:390, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(235,248,205) 0%, rgba(215,240,172,0) 100%)' },
];

// Сияние — same positions/structure as KRASNY, vivid aurora palette, slightly dimmer cores
const SIYANIE: CL[] = [
  // Group 1 (top) — vivid cyan-teal
  { x:66,  y:48,  w:381, h:422, blur:90,  blend:'lighten', op:0.22, bg:'rgb(0,195,212)' },
  { x:151, y:211, w:140, h:155, blur:51,  bg:'radial-gradient(circle, rgb(25,200,215) 0%, rgba(0,175,192,0) 100%)' },
  { x:170, y:206, w:164, h:178, blur:37,  blend:'color',   bg:'radial-gradient(circle, rgb(175,245,252) 0%, rgba(155,238,248,0.65) 100%)' },
  { x:102, y:115, w:226, h:248, blur:60,  blend:'screen',  bg:'radial-gradient(circle, rgb(0,195,212) 0%, rgba(0,120,205,0.7) 100%)' },
  { x:151, y:143, w:210, h:233, blur:60,  blend:'lighten', bg:'rgb(0,195,212)' },
  { x:182, y:211, w:131, h:142, blur:59,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(0,195,212) 0%, rgba(178,250,255,0.65) 100%)' },
  { x:174, y:186, w:131, h:142, blur:59,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(25,205,218) 0%, rgba(178,250,255,0.65) 100%)' },
  // Group 1 core — warm cyan-white, slightly dimmed
  { x:163, y:188, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(168,238,248) 0%, rgba(0,195,212,0) 100%)' },
  { x:195, y:220, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(218,248,252) 0%, rgba(168,240,250,0) 100%)' },
  // Group 2 (bottom-right) — vivid blue-violet
  { x:244, y:434, w:140, h:155, blur:38,  bg:'radial-gradient(circle, rgb(80,80,242) 0%, rgba(55,45,218,0) 100%)' },
  { x:201, y:415, w:164, h:178, blur:28,  blend:'color',   bg:'radial-gradient(circle, rgb(185,185,255) 0%, rgba(165,155,252,0.65) 100%)' },
  { x:208, y:436, w:226, h:248, blur:45,  blend:'screen',  bg:'radial-gradient(circle, rgb(80,80,242) 0%, rgba(38,0,220,0.7) 100%)' },
  { x:173, y:423, w:210, h:233, blur:45,  blend:'lighten', bg:'rgb(65,65,235)' },
  { x:222, y:446, w:131, h:142, blur:44,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(80,80,242) 0%, rgba(195,195,255,0.65) 100%)' },
  { x:230, y:470, w:131, h:142, blur:44,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(110,110,248) 0%, rgba(195,195,255,0.65) 100%)' },
  { x:230, y:454, w:131, h:142, blur:44,  blend:'luminosity',  bg:'radial-gradient(circle, rgb(110,110,248) 0%, rgba(195,195,255,0.65) 100%)' },
  { x:264, y:474, w:66,  h:74,  blur:33,  blend:'lighten', op:0.5, bg:'rgb(215,215,255)' },
  // Group 2 core — blue-white, slightly dimmed
  { x:220, y:465, w:130, h:130, blur:24,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(185,185,255) 0%, rgba(70,70,240,0) 100%)' },
  { x:252, y:497, w:65,  h:65,  blur:11,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(222,222,255) 0%, rgba(205,205,255,0) 100%)' },
  // Group 3 (left) — vivid deep violet
  { x:-13, y:273, w:255, h:287, blur:95,  blend:'lighten', op:0.35, bg:'radial-gradient(circle, rgb(115,20,230) 0%, rgb(28,5,75) 100%)' },
  { x:77,  y:367, w:121, h:139, blur:33,  blend:'color',   bg:'radial-gradient(circle, rgb(155,40,245) 0%, rgba(108,12,220,0.65) 100%)' },
  { x:35,  y:327, w:160, h:177, blur:54,  blend:'lighten', bg:'rgb(115,20,230)' },
  { x:78,  y:382, w:97,  h:111, blur:52,  blend:'color-dodge', op:0.5, bg:'radial-gradient(circle, rgb(140,40,245) 0%, rgba(78,0,220,0.65) 100%)' },
  { x:57,  y:384, w:97,  h:111, blur:52,  blend:'hue',         op:0.5, bg:'radial-gradient(circle, rgb(195,155,255) 0%, rgba(222,200,255,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(148,38,238) 0%, rgba(215,185,255,0.65) 100%)' },
  { x:67,  y:367, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:'radial-gradient(circle, rgb(148,38,238) 0%, rgba(215,185,255,0.65) 100%)' },
  { x:87,  y:382, w:66,  h:74,  blur:44,  blend:'lighten', op:0.5, bg:'rgb(192,155,252)' },
  // Group 3 core — violet-white, slightly dimmed
  { x:55,  y:358, w:130, h:130, blur:32,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(200,165,252) 0%, rgba(108,18,230,0) 100%)' },
  { x:87,  y:390, w:65,  h:65,  blur:15,  blend:'screen', op:0.5, bg:'radial-gradient(circle, rgb(230,220,255) 0%, rgba(218,202,255,0) 100%)' },
];

// ── Card blob palette ─────────────────────────────────────────────────────────

type CardPalette = { fog: string; glow: string; core: string; ab1: string; ab2: string };

// Card palettes per scene per blobGroup — colors taken directly from CL array layers
// [blobGroup 0 = left/Group3, blobGroup 1 = bottom-right/Group2, blobGroup 2 = top/Group1]
// fog=lighten layer, glow=screen start, core=core gradient, ab1=cool(color-dodge), ab2=warm(hue/luminosity)
const SCENE_CARD_PALETTES: [CardPalette, CardPalette, CardPalette][] = [
  // Красный
  [
    { fog:'rgb(255,0,80)',    glow:'rgb(255,0,80)',    core:'rgb(255,238,155)', ab1:'rgb(255,0,199)',  ab2:'rgb(255,191,160)' },
    { fog:'rgb(255,63,0)',    glow:'rgb(255,0,4)',     core:'rgb(255,238,155)', ab1:'rgb(255,114,0)', ab2:'rgb(255,149,96)'  },
    { fog:'rgb(255,0,80)',    glow:'rgb(255,0,4)',     core:'rgb(255,238,155)', ab1:'rgb(191,8,188)', ab2:'rgb(255,80,10)'   },
  ],
  // Сияние
  [
    { fog:'rgb(115,20,230)',  glow:'rgb(140,40,245)',  core:'rgb(230,220,255)', ab1:'rgb(78,0,220)',   ab2:'rgb(195,155,255)'},
    { fog:'rgb(65,65,235)',   glow:'rgb(80,80,242)',   core:'rgb(222,222,255)', ab1:'rgb(38,0,220)',   ab2:'rgb(185,185,255)'},
    { fog:'rgb(0,195,212)',   glow:'rgb(0,195,212)',   core:'rgb(168,238,248)', ab1:'rgb(0,120,205)',  ab2:'rgb(25,205,218)' },
  ],
  // Рассвет
  [
    { fog:'rgb(122,163,209)', glow:'rgb(141,183,223)', core:'rgb(214,230,244)', ab1:'rgb(97,135,193)', ab2:'rgb(198,222,240)'},
    { fog:'rgb(217,141,115)', glow:'rgb(215,132,108)', core:'rgb(247,230,218)', ab1:'rgb(171,81,60)',  ab2:'rgb(240,201,185)'},
    { fog:'rgb(238,219,130)', glow:'rgb(239,215,113)', core:'rgb(252,250,216)', ab1:'rgb(178,149,59)', ab2:'rgb(241,222,166)'},
  ],
  // Лес
  [
    { fog:'rgb(105,185,35)',  glow:'rgb(120,195,40)',  core:'rgb(205,242,140)', ab1:'rgb(85,155,18)',  ab2:'rgb(190,228,120)'},
    { fog:'rgb(32,108,22)',   glow:'rgb(38,120,28)',   core:'rgb(162,215,148)', ab1:'rgb(12,55,8)',    ab2:'rgb(108,175,90)' },
    { fog:'rgb(10,190,70)',   glow:'rgb(10,190,70)',   core:'rgb(165,248,195)', ab1:'rgb(0,100,30)',   ab2:'rgb(30,200,85)'  },
  ],
  // Закат
  [
    { fog:'rgb(80,15,120)',   glow:'rgb(130,30,200)',  core:'rgb(255,215,245)', ab1:'rgb(235,80,210)', ab2:'rgb(255,140,60)' },
    { fog:'rgb(255,75,15)',   glow:'rgb(255,75,15)',   core:'rgb(255,200,100)', ab1:'rgb(200,40,5)',   ab2:'rgb(255,195,110)'},
    { fog:'rgb(255,155,15)',  glow:'rgb(255,155,15)',  core:'rgb(255,225,130)', ab1:'rgb(200,95,5)',   ab2:'rgb(255,172,40)' },
  ],
];

function CardBlobs({ palette }: { palette: CardPalette }) {
  const p = palette;
  return (
    <div style={{ position: 'absolute', inset: 0, filter: 'saturate(1.3) contrast(1.1)', transform: 'translateY(-32px)' }}>
      {/* Outer fog — very large, centered, extends well above card */}
      <div style={{
        position: 'absolute',
        left: '-25%', top: '-85%', width: '150%', height: '165%',
        borderRadius: '50%', background: p.fog,
        filter: 'blur(64px)', mixBlendMode: 'lighten', opacity: 0.55,
      }} />
      {/* Screen glow — centered */}
      <div style={{
        position: 'absolute',
        left: '5%', top: '-62%', width: '90%', height: '105%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.glow} 0%, rgba(0,0,0,0) 100%)`,
        filter: 'blur(32px)', mixBlendMode: 'screen',
      }} />
      {/* Chromatic aberration — cool hue, offset left */}
      <div style={{
        position: 'absolute',
        left: '-2%', top: '-58%', width: '84%', height: '96%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.ab1} 0%, rgba(0,0,0,0) 100%)`,
        filter: 'blur(30px)', mixBlendMode: 'screen', opacity: 0.28,
      }} />
      {/* Chromatic aberration — warm hue, offset right */}
      <div style={{
        position: 'absolute',
        left: '18%', top: '-58%', width: '84%', height: '96%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.ab2} 0%, rgba(0,0,0,0) 100%)`,
        filter: 'blur(30px)', mixBlendMode: 'screen', opacity: 0.22,
      }} />
      {/* Core 1 — warm near-white, centered */}
      <div style={{
        position: 'absolute',
        left: '15%', top: '-36%', width: '70%', height: '76%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${p.core} 0%, rgba(0,0,0,0) 100%)`,
        filter: 'blur(19px)', mixBlendMode: 'screen',
      }} />
      {/* Core 2 — near-white hot point, centered */}
      <div style={{
        position: 'absolute',
        left: '28%', top: '-14%', width: '44%', height: '46%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgb(255,252,242) 0%, rgba(0,0,0,0) 100%)',
        filter: 'blur(11px)', mixBlendMode: 'screen',
      }} />
    </div>
  );
}

function buildLayers(b0: BlobColors, b1: BlobColors, b2: BlobColors): CL[] {
  const rgb = ([r,g,b]: RGB) => `rgb(${r},${g},${b})`;
  const ra  = ([r,g,b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;
  const rad = (a: string, b: string) => `radial-gradient(circle, ${a} 0%, ${b} 100%)`;
  return [
    // Group 1 (top, b2) — +20x +20y
    { x:46,  y:83,  w:381, h:422, blur:90,  blend:'lighten', op:0.4, bg:rgb(b2.halo) },
    { x:131, y:246, w:140, h:155, blur:51,  bg:rad(rgb(b2.bodyInner), ra(b2.bodyOuter,0)) },
    { x:150, y:241, w:164, h:178, blur:37,  blend:'color',   bg:rad(rgb(b2.core), ra(b2.bodyOuter,0.65)) },
    { x:82,  y:150, w:226, h:248, blur:60,  blend:'screen',  bg:rad(rgb(b2.rim), ra(b2.halo,0.7)) },
    { x:131, y:178, w:210, h:233, blur:60,  blend:'lighten', bg:rgb(b2.bodyInner) },
    { x:162, y:246, w:131, h:142, blur:59,  blend:'color-dodge', op:0.5, bg:rad(rgb(b2.rim), ra(b2.core,0.65)) },
    { x:154, y:221, w:131, h:142, blur:59,  blend:'luminosity',  op:0.5, bg:rad(rgb(b2.bodyOuter), ra(b2.core,0.65)) },
    // Group 2 (bottom-right, b1) — -20x -20y
    { x:219, y:449, w:140, h:155, blur:51,  bg:rad(rgb(b1.bodyInner), ra(b1.bodyOuter,0)) },
    { x:176, y:430, w:164, h:178, blur:37,  blend:'color',   bg:rad(rgb(b1.core), ra(b1.bodyOuter,0.65)) },
    { x:183, y:451, w:226, h:248, blur:60,  blend:'screen',  bg:rad(rgb(b1.rim), ra(b1.halo,0.7)) },
    { x:148, y:438, w:210, h:233, blur:60,  blend:'lighten', bg:rgb(b1.bodyInner) },
    { x:197, y:461, w:131, h:142, blur:59,  blend:'color-dodge', op:0.5, bg:rad(rgb(b1.rim), ra(b1.core,0.65)) },
    { x:205, y:485, w:131, h:142, blur:59,  blend:'luminosity',  op:0.5, bg:rad(rgb(b1.bodyOuter), ra(b1.core,0.65)) },
    { x:205, y:469, w:131, h:142, blur:59,  blend:'luminosity',  bg:rad(rgb(b1.bodyOuter), ra(b1.core,0.65)) },
    { x:239, y:489, w:66,  h:74,  blur:44,  blend:'lighten', op:0.5, bg:rgb(b1.core) },
    // Group 3 (left, b0) — +20x, -30y
    { x:12,  y:298, w:255, h:287, blur:95,  blend:'lighten', op:0.6, bg:rad(rgb(b0.halo), 'rgb(10,5,20)') },
    { x:102, y:392, w:121, h:139, blur:33,  blend:'color',   bg:rad(rgb(b0.bodyOuter), ra(b0.core,0.65)) },
    { x:60,  y:352, w:160, h:177, blur:54,  blend:'lighten', bg:rgb(b0.halo) },
    { x:103, y:407, w:97,  h:111, blur:52,  blend:'color-dodge', op:0.5, bg:rad(rgb(b0.rim), ra(b0.halo,0.65)) },
    { x:82,  y:409, w:97,  h:111, blur:52,  blend:'hue',         op:0.5, bg:rad(rgb(b0.bodyInner), ra(b0.core,0.65)) },
    { x:92,  y:392, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:rad(rgb(b0.bodyOuter), ra(b0.core,0.65)) },
    { x:92,  y:392, w:97,  h:111, blur:52,  blend:'luminosity',  op:0.5, bg:rad(rgb(b0.bodyOuter), ra(b0.core,0.65)) },
    { x:112, y:407, w:66,  h:74,  blur:44,  blend:'lighten', op:0.5, bg:rgb(b0.bodyInner) },
  ];
}

// Detail screen blob — ONE group, from Figma node 105-198 coordinates
// Group origin on detail screen: x=-64, y=77 (overflows left edge)
function buildDetailLayers(p: CardPalette): CL[] {
  const a = (rgb: string, alpha: number) => rgb.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
  const rad = (s: string, e: string) => `radial-gradient(circle, ${s} 0%, ${e} 100%)`;
  return [
    { x:-54, y:77,  w:485, h:537, blur:127, blend:'lighten', op:0.4, bg:p.fog },
    { x:9,   y:199, w:419, h:449, blur:20,  blend:'lighten', op:0.4, bg:p.fog },
    { x:145, y:211, w:178, h:197, blur:72,  bg:rad(p.ab2, a(p.fog, 0)) },
    { x:90,  y:188, w:208, h:226, blur:52,  blend:'color',       bg:rad('rgb(255,216,197)', 'rgba(255,253,180,0.65)') },
    { x:99,  y:214, w:287, h:316, blur:85,  blend:'screen',      bg:rad(p.glow, a(p.ab1, 0.7)) },
    { x:55,  y:198, w:268, h:296, blur:85,  blend:'lighten',     bg:p.fog },
    { x:116, y:226, w:167, h:181, blur:83,  blend:'color-dodge', op:0.5, bg:rad(p.glow, a(p.core, 0.65)) },
    { x:126, y:258, w:167, h:181, blur:83,  blend:'luminosity',  op:0.5, bg:rad(p.ab2, a(p.core, 0.65)) },
    { x:140, y:220, w:130, h:130, blur:32,  blend:'screen',      op:0.5, bg:rad(p.core, a(p.glow, 0)) },
    { x:173, y:253, w:65,  h:65,  blur:15,  blend:'screen',      op:0.5, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,250,235,0) 100%)' },
  ];
}

function getSceneLayers(idx: number): CL[] {
  if (idx === 0) return KRASNY;
  if (idx === 1) return SIYANIE;
  if (idx === 2) return RASSVET;
  if (idx === 3) return LES;
  if (idx === 4) return ZAKATY;
  const s = SCENES[idx];
  return buildLayers(s.blobs[0], s.blobs[1], s.blobs[2]);
}

// Arc carousel
const ARC_R    = 240;   // arc radius px
const ARC_STEP = 20;    // degrees per sphere

// ── Style picker sheet ────────────────────────────────────────────────────────

const STYLE_PICKER_BLOBS: CL[] = buildLayers(
  // b0 = Group 3 (left) — warm stone, Greek sphere
  { halo: c(100,65,25),  rim: c(210,165,95),  bodyOuter: c(165,120,65),  bodyInner: c(230,195,145), core: c(255,240,215) },
  // b1 = Group 2 (bottom-right) — blue, Camera sphere
  { halo: c(20,55,140),  rim: c(55,140,230),  bodyOuter: c(35,100,200),  bodyInner: c(90,165,245),  core: c(195,225,255) },
  // b2 = Group 1 (top) — pink-red, Visualize sphere
  { halo: c(180,30,70),  rim: c(255,90,130),  bodyOuter: c(200,55,95),   bodyInner: c(255,150,180), core: c(255,210,220) },
);

const STYLE_ITEMS: { title: string; desc: string; src?: string; gradient?: string; imgScale?: number; imgOffsetX?: number; imgOffsetY?: number; glassAccents?: boolean; glowColor: string }[] = [
  {
    title: 'Из фото',
    desc: 'Взять свет и атмосферу из фотографии',
    src: '/style-visualize.jpg',
    glassAccents: true,
    glowColor: 'rgba(210,70,110,0.30)',
  },
  {
    title: 'Настроение',
    desc: 'Подобрать\nпод ощущения',
    src: '/style-camera.png',
    imgScale: 1.3,
    glowColor: 'rgba(55,125,190,0.22)',
  },
  {
    title: 'Кастомный',
    desc: 'Настройте полностью вручную',
    src: '/style-greek.png',
    imgScale: 1.43,
    imgOffsetX: -4,
    imgOffsetY: -4,
    glowColor: 'rgba(175,130,85,0.20)',
  },
];

function GlassSphere({ src, gradient, size, imgScale = 1, imgOffsetX = 0, imgOffsetY = 0, glassAccents = false }: {
  src?: string; gradient?: string; size: number; imgScale?: number; imgOffsetX?: number; imgOffsetY?: number; glassAccents?: boolean;
}) {
  const hasOffset = imgOffsetX !== 0 || imgOffsetY !== 0 || imgScale !== 1;
  const transform = hasOffset
    ? `translate(${imgOffsetX}px, ${imgOffsetY}px) scale(${imgScale})`
    : undefined;

  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: 'none',
    }}>
      {src ? (
        <img src={src} alt="" style={{
          display: 'block', width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center center',
          transform,
        }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: gradient }} />
      )}

      {/* Виньетка — тёмные края, даёт объём шара */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background:
        'radial-gradient(circle, transparent 42%, rgba(0,0,0,0.52) 100%)' }} />

      {/* Мягкий диффузный блик — матовое стекло, верхний левый */}
      <div style={{ position: 'absolute', inset: 0, background:
        'radial-gradient(ellipse 58% 38% at 28% 24%, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)' }} />

      {/* Точечный глинт */}
      <div style={{ position: 'absolute', inset: 0, background:
        'radial-gradient(ellipse 10% 6% at 27% 20%, rgba(255,255,255,0.92) 0%, transparent 100%)' }} />

      {/* Нижний контровой ободок — отражение света снизу */}
      <div style={{ position: 'absolute', inset: 0, background:
        'radial-gradient(ellipse 70% 18% at 50% 96%, rgba(255,255,255,0.14) 0%, transparent 100%)' }} />

      {glassAccents && <>
        {/* Розовый хроматический край — верхняя дуга */}
        <div style={{ position: 'absolute', inset: 0, background:
          'radial-gradient(ellipse 100% 28% at 50% 0%, rgba(255,130,185,0.24) 0%, transparent 100%)' }} />

        {/* Розовый цветной блик поверх основного */}
        <div style={{ position: 'absolute', inset: 0, background:
          'radial-gradient(ellipse 40% 26% at 26% 22%, rgba(255,150,195,0.30) 0%, transparent 100%)' }} />

        {/* Оранжевое каустическое пятно — рассеянный свет сквозь сферу */}
        <div style={{ position: 'absolute', inset: 0, background:
          'radial-gradient(ellipse 28% 20% at 65% 62%, rgba(255,155,70,0.22) 0%, transparent 100%)' }} />

        {/* Оранжевый тёплый нижний ободок */}
        <div style={{ position: 'absolute', inset: 0, background:
          'radial-gradient(ellipse 65% 20% at 50% 97%, rgba(255,140,60,0.32) 0%, transparent 100%)' }} />
      </>}
    </div>
  );
}

function StylePickerSheet({ onClose }: { onClose: () => void }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 340);
  };

  const isIn = entered && !exiting;
  const ease = 'cubic-bezier(0.32, 0.94, 0.60, 1)';


  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: [
        'radial-gradient(ellipse 80% 50% at 20% 30%, rgba(185,45,85,0.07) 0%, transparent 65%)',
        'radial-gradient(ellipse 70% 55% at 80% 70%, rgba(45,95,185,0.06) 0%, transparent 60%)',
        'linear-gradient(to bottom, rgb(18,12,26) 0%, rgb(12,9,18) 100%)',
      ].join(', '),
      opacity:    isIn ? 1 : 0,
      transform:  isIn ? 'translateY(0px)' : 'translateY(56px)',
      filter:     isIn ? 'blur(0px)' : 'blur(14px)',
      transition: `opacity 0.34s ${ease}, transform 0.34s ${ease}, filter 0.34s ${ease}`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Blob background — same shapes as main screen, 20% opacity */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.10, pointerEvents: 'none', filter: 'saturate(1.2)' }}>
        {STYLE_PICKER_BLOBS.map((l, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: l.x, top: l.y, width: l.w, height: l.h,
            borderRadius: '50%',
            filter: `blur(${l.blur}px)`,
            mixBlendMode: (l.blend ?? 'normal') as React.CSSProperties['mixBlendMode'],
            opacity: l.op ?? 1,
            background: l.bg,
            pointerEvents: 'none',
          }} />
        ))}
      </div>
      {/* Header — button bottom aligns to top:65+44=109, matching Controls on main screen */}
      <div style={{ height: 109, display: 'flex', alignItems: 'flex-end', paddingLeft: 16 }}>
        <button
          onClick={handleClose}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,200,220,0.10)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none" style={{ marginLeft: -4 }}>
            <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="rgba(255,255,255,0.88)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Items — centered in remaining space, shifted right+up */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 80, position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 43, paddingLeft: 52, paddingRight: 16 }}>
        {STYLE_ITEMS.map((item, i) => {
          const delay = `${80 + i * 110}ms`;
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 24,
                opacity:    isIn ? 1 : 0,
                transform:  isIn ? 'translateY(0px)' : 'translateY(44px)',
                filter:     isIn ? 'blur(0px)' : 'blur(12px)',
                transition: `opacity 0.42s ${ease} ${delay}, transform 0.42s ${ease} ${delay}, filter 0.38s ${ease} ${delay}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0, width: 86, height: 86, filter: 'saturate(1.15) contrast(1.05)' }}>
                {/* Glow 1 — большое размытие, 20% */}
                <div style={{
                  position: 'absolute', inset: -32, borderRadius: '50%', pointerEvents: 'none',
                  background: item.src ? `url(${item.src}) center/cover no-repeat` : item.gradient,
                  filter: 'blur(28px)', opacity: 0.14,
                }} />
                {/* Glow 2 — среднее размытие, 50% */}
                <div style={{
                  position: 'absolute', inset: -14, borderRadius: '50%', pointerEvents: 'none',
                  background: item.src ? `url(${item.src}) center/cover no-repeat` : item.gradient,
                  filter: 'blur(10px)', opacity: 0.26,
                }} />
                <GlassSphere src={item.src} gradient={item.gradient} size={86} imgScale={item.imgScale} imgOffsetX={item.imgOffsetX} imgOffsetY={item.imgOffsetY} glassAccents={item.glassAccents} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.42)', marginTop: 6, lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// ── Flare effect ─────────────────────────────────────────────────────────────

// Blob core positions in screen coords (after CSSBlobs translateY(-40) scale(0.9))
const BLOB_CORE_CENTERS: [number, number][] = [
  [128, 384], // blobGroup 0 (left)
  [277, 481], // blobGroup 1 (bottom-right)
  [225, 231], // blobGroup 2 (top)
];
const BLOB_CORE_MAX_DIST = 200; // px — distance at which intensity → 0

function flareColorsFromPalette(p: CardPalette): { core: string; mid: string; glow: string } {
  const a = (rgb: string, op: number) => rgb.replace('rgb(', 'rgba(').replace(')', `,${op})`);
  return { core: a(p.core, 0.95), mid: a(p.fog, 0.60), glow: a(p.fog, 0.28) };
}

interface FlareState { id: number; x: number; y: number; core: string; mid: string; glow: string; intensity: number }

function FlareEffect({ x, y, core, mid, glow, intensity, onDone }: {
  x: number; y: number;
  core: string; mid: string; glow: string;
  intensity: number; // 0 = far from core, 1 = at core
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<'mount' | 'in' | 'out'>('mount');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase('in'));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase === 'in') {
      const t = setTimeout(() => setPhase('out'), 160);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => onDoneRef.current(), 1150);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // All visual params scale with intensity (0=periphery, 1=core)
  const t = intensity;
  const innerSize = Math.round(40 + 87 * t);   // 40px → 127px (core +30%)
  const innerOp   = 0.05 + 0.81 * t;           // 0.05 (dim periphery) → 0.86 (core +20%)
  const innerBlur = 19.6 - 11.8 * t;           // 19.6px → 7.8px
  const innerSat  = 1.8 - 0.8 * t;             // 1.8 (vivid periphery) → 1.0 (core)
  const outerSize = Math.round(80 + 174 * t);  // 80px → 254px (core +30%)
  const outerOp   = 0.02 + 0.53 * t;           // 0.02 (dim periphery) → 0.55 (core +20%)
  const outerBlur = 39.2 - 19.6 * t;           // 39.2px → 19.6px
  const outerSat  = 1.8 - 0.8 * t;             // 1.8 → 1.0

  const style: React.CSSProperties =
    phase === 'mount' ? { transform: 'scale(0.3)', opacity: 0, transition: 'none' } :
    phase === 'in'    ? { transform: 'scale(1.0)', opacity: 1, transition: 'transform 160ms cubic-bezier(0.2,0,0,1), opacity 130ms ease-out' } :
                        { transform: 'scale(1.75)', opacity: 0, transition: 'transform 1150ms cubic-bezier(0,0,0.35,1), opacity 1150ms cubic-bezier(0.5,0,1,1)' };

  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', ...style }}>
      <div style={{
        position: 'absolute', width: innerSize, height: innerSize,
        left: -innerSize / 2, top: -innerSize / 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, white 0%, ${core} 18%, ${mid} 52%, transparent 74%)`,
        mixBlendMode: 'screen',
        opacity: innerOp,
        filter: `blur(${innerBlur}px) saturate(${innerSat})`,
      }} />
      <div style={{
        position: 'absolute', width: outerSize, height: outerSize,
        left: -outerSize / 2, top: -outerSize / 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${mid} 0%, ${glow} 38%, transparent 68%)`,
        mixBlendMode: 'screen',
        opacity: outerOp,
        filter: `blur(${outerBlur}px) saturate(${outerSat})`,
      }} />
    </div>
  );
}

// ── Blob heat — cursor proximity brightens the nearest blob core ──────────────

// Activation zone: full heat within HEAT_FULL px, fades out to zero at HEAT_ZERO px
const HEAT_FULL = 160;
const HEAT_ZERO = 300;

function BlobHeat({ sceneIdx }: { sceneIdx: number }) {
  const glowRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const sceneRef  = useRef(sceneIdx);
  sceneRef.current = sceneIdx;

  const heat    = useRef([0, 0, 0]);   // smoothed heat per group (0–1)
  const cursor  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    let rafId = 0;

    const onMouseMove = (e: MouseEvent) => {
      const el = glowRefs.current[0]?.parentElement;
      if (!el) return;
      const r = el.getBoundingClientRect();
      cursor.current.x = e.clientX - r.left;
      cursor.current.y = e.clientY - r.top;
    };

    const onMouseLeave = () => { cursor.current.x = -9999; cursor.current.y = -9999; };

    const tick = () => {
      const { x, y } = cursor.current;
      const scene = sceneRef.current;

      BLOB_CORE_CENTERS.forEach(([cx, cy], i) => {
        const dist = Math.hypot(x - cx, y - cy);
        // 1 when within HEAT_FULL px, linear falloff to 0 at HEAT_ZERO px
        const target = Math.max(0, 1 - Math.max(0, dist - HEAT_FULL) / (HEAT_ZERO - HEAT_FULL));

        // Slow rise (~2s to warm up), even slower fall (~5s to cool down)
        const speed = heat.current[i] < target ? 0.007 : 0.003;
        heat.current[i] += (target - heat.current[i]) * speed;

        const div = glowRefs.current[i];
        if (!div) return;

        const h = heat.current[i];
        if (h < 0.004) { div.style.opacity = '0'; return; }

        const palette = (SCENE_CARD_PALETTES[scene] ?? SCENE_CARD_PALETTES[0])[i];
        // Use core color blended 60% toward white → screen blend reads as brightness boost
        const m = palette.core.match(/\d+/g) ?? ['255', '255', '255'];
        const [r, g, b] = m.map(Number);
        const lr = Math.round(r + (255 - r) * 0.60);
        const lg = Math.round(g + (255 - g) * 0.60);
        const lb = Math.round(b + (255 - b) * 0.60);

        div.style.opacity  = (h * 0.75).toFixed(3);
        div.style.background =
          `radial-gradient(circle, rgba(${lr},${lg},${lb},0.55) 0%, rgba(${r},${g},${b},0.20) 50%, transparent 100%)`;
      });

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const R = 130; // glow element radius in px
  return (
    <>
      {BLOB_CORE_CENTERS.map(([cx, cy], i) => (
        <div
          key={i}
          ref={el => { glowRefs.current[i] = el; }}
          style={{
            position: 'absolute',
            left: cx - R, top: cy - R,
            width: R * 2, height: R * 2,
            borderRadius: '50%',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
            opacity: 0,
            filter: 'blur(52px)',
            willChange: 'opacity',
            zIndex: 2,
          }}
        />
      ))}
    </>
  );
}

// ── CSS blob renderer ─────────────────────────────────────────────────────────

function CSSBlobs({ sceneIdx }: { sceneIdx: number }) {
  const blobFilter = sceneIdx === 3
    ? 'saturate(1.04) contrast(1.1)'
    : 'saturate(1.3) contrast(1.1)';
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', filter: blobFilter, transform: 'translateY(-40px) scale(0.9)', transformOrigin: 'center center' }}>
      {getSceneLayers(sceneIdx).map((l, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: l.x, top: l.y, width: l.w, height: l.h,
          borderRadius: '50%',
          filter: `blur(${l.blur}px)`,
          mixBlendMode: (l.blend ?? 'normal') as React.CSSProperties['mixBlendMode'],
          opacity: l.op ?? 1,
          background: l.bg,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}

// ── Source detail screen ──────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

function hslToRgb(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255);
  return `rgb(${f(0)},${f(8)},${f(4)})`;
}

function rgbToHue(rgb: string): number {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return 0;
  const r = +m[0] / 255, g = +m[1] / 255, b = +m[2] / 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(h * 60);
}

function hueToPalette(h: number): CardPalette {
  return {
    fog:  hslToRgb(h, 100, 48),
    glow: hslToRgb(h, 100, 50),
    core: 'rgb(255,238,155)',
    ab1:  hslToRgb(h - 40, 90, 42),
    ab2:  hslToRgb(h + 15, 80, 62),
  };
}

// Visual center of the detail-screen blob (used as transform-origin for transition)
const DETAIL_BLOB_CENTER: [number, number] = [205, 285];

function SourceDetailScreen({
  light, sceneIdx, onClose, onSave,
}: {
  light: LightSource;
  sceneIdx: number;
  onClose: () => void;
  onSave: (updates: SceneLightSettings) => void;
}) {
  const [phase, setPhase] = useState<'entering' | 'open' | 'exiting'>('entering');

  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setPhase('open'));
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, []);

  const handleClose = () => {
    setPhase('exiting');
    setTimeout(onClose, 620);
  };

  const scenePalette = (SCENE_CARD_PALETTES[sceneIdx] ?? SCENE_CARD_PALETTES[0])[light.blobGroup];
  const sceneData = light.sceneSettings?.[sceneIdx];
  const initBrightness = (sceneData?.brightness ?? light.brightness) / 100;
  const initHue = sceneData?.customHue ?? rgbToHue(scenePalette.fog);
  const initSaturation = (sceneData?.customSaturation ?? 72) / 100;

  const [brightness, setBrightness] = useState(initBrightness);
  const brightDrag = useRef({ active: false, startY: 0, startVal: initBrightness });
  const [saturation, setSaturation] = useState(initSaturation);
  const satDrag = useRef({ active: false, startY: 0, startVal: initSaturation });

  const onBrightDown = useCallback((e: React.PointerEvent) => {
    brightDrag.current = { active: true, startY: e.clientY, startVal: brightness };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [brightness]);

  const onBrightMove = useCallback((e: React.PointerEvent) => {
    if (!brightDrag.current.active) return;
    const dy = e.clientY - brightDrag.current.startY;
    setBrightness(Math.max(0, Math.min(1, brightDrag.current.startVal + dy / 180)));
  }, []);

  const onBrightUp = useCallback(() => { brightDrag.current.active = false; }, []);

  const onSatDown = useCallback((e: React.PointerEvent) => {
    satDrag.current = { active: true, startY: e.clientY, startVal: saturation };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [saturation]);

  const onSatMove = useCallback((e: React.PointerEvent) => {
    if (!satDrag.current.active) return;
    const dy = e.clientY - satDrag.current.startY;
    setSaturation(Math.max(0, Math.min(1, satDrag.current.startVal - dy / 80)));
  }, []);

  const onSatUp = useCallback(() => { satDrag.current.active = false; }, []);

  // Restart arc breathing animation each time the screen opens
  const [arcAnimKey, setArcAnimKey] = useState(0);
  useEffect(() => {
    if (phase === 'open') setArcAnimKey(k => k + 1);
  }, [phase]);

  const [hue, setHue] = useState(initHue);
  const stripRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const applyHue = useCallback((clientX: number) => {
    if (!stripRef.current) return;
    const { left, width } = stripRef.current.getBoundingClientRect();
    setHue(Math.round(Math.max(0, Math.min(360, ((clientX - left) / width) * 360))));
  }, []);

  const activePalette = hueToPalette(hue);
  const layers = buildDetailLayers(activePalette);

  // Blob starts at its position on the main screen, expands to fill detail screen
  const [fromX, fromY] = BLOB_CORE_CENTERS[light.blobGroup];
  const dx = fromX - DETAIL_BLOB_CENTER[0];
  const dy = fromY - DETAIL_BLOB_CENTER[1];
  const isOpen = phase === 'open';
  const EASE   = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const SMOOTH = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  const blobTransform = phase !== 'open' ? `translate(${dx}px, ${dy}px) scale(0.38)` : 'none';
  const blobTransition = phase === 'open'
    ? `transform 0.78s ${SMOOTH}`
    : phase === 'exiting'
      ? `transform 0.55s ${EASE}`
      : 'none';

  // Brightness-driven blob visuals
  // Default entry = 0.72: full color, scale=1.0. Below → gray glow. Above → bigger.
  const DEFAULT_B = 0.72;
  const tLow  = Math.max(0, Math.min(1, brightness / DEFAULT_B));
  const tHigh = Math.max(0, Math.min(1, (brightness - DEFAULT_B) / (1 - DEFAULT_B)));
  const satMul = lerp(0.05, 1.6, saturation);
  const blobFilter = `saturate(${lerp(0, satMul, tLow).toFixed(2)}) contrast(${lerp(0.65, 1.12, tLow).toFixed(2)}) brightness(${lerp(0.20, 1.0, tLow).toFixed(2)})`;
  const blobScale  = brightness <= DEFAULT_B ? lerp(0.50, 1.0, tLow) : lerp(1.0, 1.20, tHigh);

  // Arc geometry — ARC_Y tracks the blob's gradient boundary
  const ARC_CX   = 201;
  const ARC_Y    = lerp(390, 580, brightness);
  const arcHalfW = lerp(18, 152, brightness);
  const arcSag   = lerp(8, 72, brightness);

  const glassCircle: React.CSSProperties = {
    width: 44, height: 44, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    background: 'rgba(255,255,255,0.08)',
    border: '0.5px solid rgba(255,255,255,0.18)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.22)',
  };

  const initValRef = useRef({ brightness: initBrightness, hue: initHue, saturation: initSaturation });
  const isDirty = brightness !== initValRef.current.brightness || hue !== initValRef.current.hue || saturation !== initValRef.current.saturation;

  const handleSaveAndClose = () => {
    onSave({ brightness: Math.round(brightness * 100), customHue: hue, customSaturation: Math.round(saturation * 100) });
    handleClose();
  };

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 30, overflow: 'hidden',
        background: 'linear-gradient(to bottom, rgb(23,22,28) 0%, rgb(31,12,15) 100%)',
        opacity: isOpen ? 1 : 0,
        transition: phase === 'exiting' ? `opacity 0.55s ${EASE}` : `opacity 0.68s ${SMOOTH}`,
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Blob — outer: enter/exit animation | inner: brightness + scale */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: blobTransform,
        transformOrigin: `${DETAIL_BLOB_CENTER[0]}px ${DETAIL_BLOB_CENTER[1]}px`,
        transition: blobTransition,
        willChange: 'transform',
        pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          filter: blobFilter,
          transform: `scale(${blobScale.toFixed(3)})`,
          transformOrigin: `${DETAIL_BLOB_CENTER[0]}px ${DETAIL_BLOB_CENTER[1]}px`,
          transition: 'filter 0.12s ease, transform 0.12s ease',
        }}>
          {layers.map((l, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: l.x, top: l.y, width: l.w, height: l.h,
              borderRadius: '50%',
              filter: `blur(${l.blur}px)`,
              mixBlendMode: (l.blend ?? 'normal') as React.CSSProperties['mixBlendMode'],
              opacity: l.op ?? 1,
              background: l.bg,
              pointerEvents: 'none',
            }} />
          ))}
        </div>
        {/* White core — outer soft halo */}
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - 29, top: DETAIL_BLOB_CENTER[1] - 29,
          width: 58, height: 58, borderRadius: '50%',
          filter: 'blur(26px)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(255,252,242,0.30) 50%, transparent 75%)',
          opacity: lerp(0.64, 0, tLow),
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
        {/* White core — inner crisp point */}
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - 12, top: DETAIL_BLOB_CENTER[1] - 12,
          width: 24, height: 24, borderRadius: '50%',
          filter: 'blur(10px)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(255,252,245,0.50) 50%, transparent 80%)',
          opacity: lerp(0.72, 0, tLow),
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
      </div>

      {/* Bottom vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, transparent 40%, rgb(20,13,17) 80%)',
      }} />

      {/* Status bar */}
      <StatusBar />

      {/* Nav bar */}
      <div style={{
        position: 'absolute', top: 65, left: 0, right: 0, height: 44, zIndex: 20,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'none' : 'translateY(10px)',
        transition: `opacity 0.38s ${EASE} 0.10s, transform 0.38s ${EASE} 0.10s`,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}>
        {/* Back */}
        <button onClick={handleClose} style={{ ...glassCircle, position: 'absolute', left: 16, top: 0 }}>
          <svg width="10" height="16" viewBox="107 87 27 42" fill="rgba(255,255,255,0.82)" style={{ marginLeft: -2 }}>
            <path d="M110.586 108.014C110.586 107.682 110.641 107.383 110.752 107.117C110.874 106.852 111.062 106.597 111.316 106.354L128.134 90.1006C128.543 89.6911 129.047 89.4863 129.645 89.4863C130.043 89.4863 130.403 89.5859 130.724 89.7852C131.056 89.9733 131.316 90.2279 131.504 90.5488C131.703 90.8698 131.803 91.2295 131.803 91.6279C131.803 92.2145 131.587 92.7292 131.155 93.1719L115.749 108.014L131.155 122.839C131.587 123.282 131.803 123.796 131.803 124.383C131.803 124.792 131.703 125.158 131.504 125.479C131.316 125.811 131.056 126.071 130.724 126.259C130.403 126.447 130.043 126.541 129.645 126.541C129.047 126.541 128.543 126.336 128.134 125.927L111.316 109.674C111.062 109.43 110.874 109.176 110.752 108.91C110.641 108.633 110.586 108.335 110.586 108.014Z" />
          </svg>
        </button>

        {/* Title */}
        <span style={{
          position: 'absolute', left: 80, right: 80, top: 0, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 600, color: 'rgba(255,239,241,0.92)', letterSpacing: '-0.2px',
          pointerEvents: 'none',
        }}>
          {light.name}
        </span>

        {/* Checkmark — appears with spring animation when values changed */}
        <button
          onClick={handleSaveAndClose}
          style={{
            ...glassCircle,
            position: 'absolute', right: 16, top: 0,
            background: 'rgba(255,255,255,0.08)',
            opacity: isDirty ? 1 : 0,
            transform: isDirty ? 'scale(1)' : 'scale(0.55)',
            transition: 'opacity 0.42s cubic-bezier(0.34,1.56,0.64,1), transform 0.42s cubic-bezier(0.34,1.56,0.64,1)',
            pointerEvents: isDirty ? 'auto' : 'none',
          }}
        >
          <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
            <path d="M1.5 6L5.5 10L13.5 1.5" stroke="rgba(255,255,255,0.88)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Arc breathing keyframe */}
      <style>{`@keyframes arcBreathe{0%{opacity:1}40%{opacity:0.70}80%{opacity:1}100%{opacity:1}}`}</style>

      {/* Brightness arc — outer: fade in/out | inner: breathing animation */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none',
        opacity: isOpen ? 1 : 0,
        transition: `opacity 0.40s ${EASE} 0.24s`,
      }}>
        <div key={arcAnimKey} style={{
          position: 'absolute', inset: 0,
          animation: isOpen ? 'arcBreathe 3.4s ease-in-out 0.64s' : 'none',
        }}>
          {/* SVG arc line */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            <path
              d={`M ${ARC_CX - arcHalfW} ${ARC_Y} Q ${ARC_CX} ${ARC_Y + arcSag} ${ARC_CX + arcHalfW} ${ARC_Y}`}
              stroke="rgba(255,255,255,0.46)"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          {/* Sun icon — purely visual, left tip of arc */}
          <div style={{
            position: 'absolute',
            left: ARC_CX - arcHalfW - 12,
            top: ARC_Y - 12,
            width: 24, height: 24, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.85)" />
              <line x1="10" y1="1.5" x2="10" y2="4.5"   stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="15.5" x2="10" y2="18.5"  stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="1.5" y1="10" x2="4.5" y2="10"    stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="15.5" y1="10" x2="18.5" y2="10"  stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="3.6" y1="3.6"   x2="5.7" y2="5.7"   stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14.3" y1="14.3" x2="16.4" y2="16.4" stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16.4" y1="3.6"  x2="14.3" y2="5.7"  stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="5.7" y1="14.3"  x2="3.6" y2="16.4"  stroke="rgba(255,255,255,0.58)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Arc drag zone — full arc width + 10px above + 10px below + full sag depth */}
      <div
        style={{
          position: 'absolute',
          left: ARC_CX - arcHalfW - 10,
          top: ARC_Y - 10,
          width: arcHalfW * 2 + 20,
          height: Math.ceil(arcSag) + 20,
          zIndex: 13,
          touchAction: 'none',
          cursor: 'ns-resize',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onPointerDown={onBrightDown}
        onPointerMove={onBrightMove}
        onPointerUp={onBrightUp}
        onPointerCancel={onBrightUp}
      />

      {/* Saturation control — vertical line + droplet icon, right edge */}
      {(() => {
        const SAT_X = 364;
        const SAT_ICON_CY = 368;
        const SAT_LINE_LEN = lerp(4, 150, saturation);
        return (
          <>
            <div style={{
              position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none',
              opacity: isOpen ? 1 : 0,
              transition: `opacity 0.40s ${EASE} 0.28s`,
            }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                <line
                  x1={SAT_X} y1={SAT_ICON_CY - 14}
                  x2={SAT_X} y2={SAT_ICON_CY - 14 - SAT_LINE_LEN}
                  stroke="rgba(255,255,255,0.46)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                left: SAT_X - 12, top: SAT_ICON_CY - 12,
                width: 24, height: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 2 C14 6,14.5 9,14.5 11.5 A5.5 5.5 0 0 1 3.5 11.5 C3.5 9,4 6,9 2Z"
                    fill="rgba(255,255,255,0.85)"
                    stroke="rgba(255,255,255,0.30)"
                    strokeWidth="0.5"
                  />
                </svg>
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                left: SAT_X - 30,
                top: SAT_ICON_CY - 14 - 150 - 30,
                width: 60,
                height: 176 + 60,
                zIndex: 14,
                touchAction: 'none',
                cursor: 'ns-resize',
                pointerEvents: isOpen ? 'auto' : 'none',
              }}
              onPointerDown={onSatDown}
              onPointerMove={onSatMove}
              onPointerUp={onSatUp}
              onPointerCancel={onSatUp}
            />
          </>
        );
      })()}

      {/* Hue strip */}
      <div style={{
        position: 'absolute', left: 24, right: 24, bottom: 72, zIndex: 10,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'none' : 'translateY(14px)',
        transition: `opacity 0.40s ${EASE} 0.20s, transform 0.40s ${EASE} 0.20s`,
      }}>
        <div
          ref={stripRef}
          style={{
            position: 'relative', height: 36, borderRadius: 18,
            background: [
              'linear-gradient(to right,',
              'hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%),',
              'hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%),',
              'hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%),',
              'hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%),',
              'hsl(360,100%,50%))',
            ].join(' '),
            boxShadow: '0 4px 28px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.18)',
            cursor: 'pointer',
            touchAction: 'none',
          }}
          onPointerDown={(e) => {
            isDragging.current = true;
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            applyHue(e.clientX);
          }}
          onPointerMove={(e) => { if (isDragging.current) applyHue(e.clientX); }}
          onPointerUp={() => { isDragging.current = false; }}
          onPointerCancel={() => { isDragging.current = false; }}
        >
          {/* Glass sheen overlay */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 50%, rgba(0,0,0,0.10) 100%)',
          }} />

          {/* Glass disc thumb — iOS 26 liquid glass style */}
          <div style={{
            position: 'absolute', top: '50%',
            left: `${(hue / 360) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 44, height: 44, borderRadius: '50%',
            backdropFilter: 'blur(12px) saturate(200%)',
            WebkitBackdropFilter: 'blur(12px) saturate(200%)',
            background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.08) 48%, rgba(0,0,0,0.04) 100%)',
            boxShadow: [
              '0 2px 14px rgba(0,0,0,0.40)',
              `0 0 2px 1px hsl(${hue},60%,52%)`,
              'inset 0 1px 0 rgba(255,255,255,0.62)',
            ].join(', '),
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Grabber */}
      <div style={{
        position: 'absolute', bottom: 19, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 5, borderRadius: 3,
        background: 'rgba(204,204,204,0.40)', zIndex: 20,
      }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DEFAULT_LIGHTS: LightSource[] = [
  { id: 1, name: 'Торшер',    brightness: 80,  on: true,  blobGroup: 2 }, // Group 1 (top)
  { id: 2, name: 'Лампа',     brightness: 60,  on: true,  blobGroup: 1 }, // Group 2 (bottom-right)
  { id: 3, name: 'Шар',       brightness: 100, on: true,  blobGroup: 0 }, // Group 3 (left)
  { id: 4, name: 'LED-лента', brightness: 45,  on: false, blobGroup: 2 }, // Group 1
  { id: 5, name: 'Бра',       brightness: 70,  on: false, blobGroup: 1 }, // Group 2
  { id: 6, name: 'Потолок',   brightness: 30,  on: false, blobGroup: 0 }, // Group 3
  { id: 7, name: 'Ночник',    brightness: 50,  on: false, blobGroup: 2 }, // Group 1
  { id: 8, name: 'Прожектор', brightness: 90,  on: false, blobGroup: 1 }, // Group 2
];

export default function Home() {
  const [logPos, setLogPos] = useState(0);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [lights, setLights] = useState<LightSource[]>(DEFAULT_LIGHTS);
  const [detailLight, setDetailLight] = useState<LightSource | null>(null);
  const [flares, setFlares] = useState<FlareState[]>([]);
  const flareIdRef = useRef(0);
  const toggleLight = useCallback((id: number) => {
    setLights(prev => prev.map(l => l.id === id ? { ...l, on: !l.on } : l));
  }, []);
  const activeScene = posToIdx(logPos);

  const saveLight = useCallback((id: number, sceneIdx: number, updates: SceneLightSettings) => {
    setLights(prev => prev.map(l => l.id === id ? {
      ...l,
      brightness: updates.brightness,
      sceneSettings: { ...l.sceneSettings, [sceneIdx]: updates },
    } : l));
  }, []);

  const openDetail = useCallback((light: LightSource) => {
    setDetailLight(light);
  }, []);

  // Per-blobGroup custom hue + saturation for current scene
  const groupCustomHues = lights.reduce<(number | null)[]>((acc, l) => {
    const sceneData = l.sceneSettings?.[activeScene];
    if (sceneData?.customHue !== undefined && l.on) {
      if (acc[l.blobGroup] === null || l.brightness > (lights.find(x => x.blobGroup === l.blobGroup && x.sceneSettings?.[activeScene] && x.on && x.id !== l.id)?.brightness ?? 0)) {
        acc[l.blobGroup] = sceneData.customHue;
      }
    }
    return acc;
  }, [null, null, null]);

  const groupSaturations = lights.reduce<(number | null)[]>((acc, l) => {
    const sceneData = l.sceneSettings?.[activeScene];
    if (sceneData?.customSaturation !== undefined && l.on && acc[l.blobGroup] === null) {
      acc[l.blobGroup] = sceneData.customSaturation;
    }
    return acc;
  }, [null, null, null]);

  const handleBlobClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (showOverview || showStylePicker || detailLight !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (y < 110 || y > H * 0.56) return;
    const { i: nearestGroup, d: minDist } = BLOB_CORE_CENTERS.reduce<{ i: number; d: number }>(
      (best, center, i) => {
        const d = Math.hypot(x - center[0], y - center[1]);
        return d < best.d ? { i, d } : best;
      },
      { i: 0, d: Infinity }
    );
    if (minDist > BLOB_CORE_MAX_DIST * 1.5) return;
    const primary = lights.find(l => l.blobGroup === nearestGroup && l.on)
      ?? lights.find(l => l.blobGroup === nearestGroup);
    if (primary) openDetail(primary);
  }, [showOverview, showStylePicker, detailLight, lights, openDetail]);

  const handleFlare = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (showOverview || showStylePicker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    if (y > H * 0.56) return;
    const x = e.clientX - rect.left;
    const { i: nearestGroup, d: distToCore } = BLOB_CORE_CENTERS.reduce<{ i: number; d: number }>(
      (best, center, i) => {
        const d = Math.hypot(x - center[0], y - center[1]);
        return d < best.d ? { i, d } : best;
      },
      { i: 0, d: Infinity }
    );
    const intensity = Math.max(0, 1 - distToCore / BLOB_CORE_MAX_DIST);
    const palette = (SCENE_CARD_PALETTES[activeScene] ?? SCENE_CARD_PALETTES[0])[nearestGroup];
    const colors = flareColorsFromPalette(palette);
    const id = flareIdRef.current++;
    setFlares(prev => [...prev, { id, x, y, ...colors, intensity }]);
  }, [showOverview, showStylePicker, activeScene]);

  const removeFlare = useCallback((id: number) => {
    setFlares(prev => prev.filter(f => f.id !== id));
  }, []);
  const logPosRef = useRef(0);
  const gradientRef = useRef<HTMLDivElement>(null);

  const changeScene = useCallback((i: number) => {
    const current    = logPosRef.current;
    const currentIdx = posToIdx(current);
    let delta = i - currentIdx;
    if (delta >  N / 2) delta -= N;
    if (delta < -N / 2) delta += N;
    logPosRef.current = current + delta;
    setLogPos(current + delta);
  }, []);

  useEffect(() => {
    const [r, g, b] = SCENES[activeScene].panelColor;
    if (gradientRef.current)
      gradientRef.current.style.background =
        `linear-gradient(to bottom, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0.95) 72.7%)`;
  }, [activeScene]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative overflow-hidden" style={{ width: W, height: H, background: "#17171C", borderRadius: 65 }} onPointerDown={handleFlare} onClick={handleBlobClick}>
        <CSSBlobs sceneIdx={activeScene} />
        {/* Custom hue overlays — tint each blob group when a light has been configured */}
        {groupCustomHues.map((customHue, group) => customHue === null ? null : (
          <div key={group} style={{
            position: 'absolute',
            left: BLOB_CORE_CENTERS[group][0] - 200,
            top:  BLOB_CORE_CENTERS[group][1] - 200,
            width: 400, height: 400, borderRadius: '50%',
            background: `hsl(${customHue}, ${groupSaturations[group] ?? 72}%, 52%)`,
            filter: 'blur(80px)',
            mixBlendMode: 'color',
            opacity: 1,
            pointerEvents: 'none',
            zIndex: 2,
          }} />
        ))}
        <BlobHeat sceneIdx={activeScene} />
        {/* Flares layer */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
          {flares.map(f => (
            <FlareEffect key={f.id} x={f.x} y={f.y} core={f.core} mid={f.mid} glow={f.glow} intensity={f.intensity} onDone={() => removeFlare(f.id)} />
          ))}
        </div>
        {/* Dark bottom vignette — above blobs, below UI */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.20) 100%)',
        }} />
        <StatusBar />
        {/* Progressive blur — starts at 49% from top (Figma: y=432/874) */}
        <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ top: '49%', zIndex: 5 }}>
          <div style={{
            position: 'absolute', inset: 0,
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, transparent 40%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, transparent 40%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backdropFilter: 'blur(50px)', WebkitBackdropFilter: 'blur(50px)',
            maskImage: 'linear-gradient(to bottom, transparent 15%, black 45%, black 65%, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 15%, black 45%, black 65%, transparent 90%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backdropFilter: 'blur(100px)', WebkitBackdropFilter: 'blur(100px)',
            maskImage: 'linear-gradient(to bottom, transparent 45%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 45%, black 100%)',
          }} />
          <div ref={gradientRef} style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(24,9,9,0) 0%, rgba(24,9,9,0.95) 72.7%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.10) 100%)',
          }} />
        </div>
        <Controls onOverview={() => setShowOverview(true)} />
        <BottomTray activeScene={activeScene} logPos={logPos} onSceneChange={changeScene} onNewStyle={() => setShowStylePicker(true)} />
        {showStylePicker && <StylePickerSheet onClose={() => setShowStylePicker(false)} />}
        {showStylePicker && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: 'none' }}>
            <StatusBar />
          </div>
        )}
        {showStylePicker && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(204,204,204,0.50)' }} />
          </div>
        )}
        {showOverview && <OverviewSheet lights={lights} onToggle={toggleLight} onClose={() => setShowOverview(false)} onDetail={(l) => { setShowOverview(false); openDetail(l); }} activeScene={activeScene} />}
        {showOverview && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: 'none' }}>
            <StatusBar />
          </div>
        )}
        {showOverview && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(204,204,204,0.50)' }} />
          </div>
        )}
        {detailLight && (
          <SourceDetailScreen
            light={detailLight}
            sceneIdx={activeScene}
            onClose={() => setDetailLight(null)}
            onSave={(updates) => { saveLight(detailLight.id, activeScene, updates); setDetailLight(null); }}
          />
        )}
      </div>
    </div>
  );
}

// ── Status bar ────────────────────────────────────────────────────────────────

function StatusBar() {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between"
      style={{
        height: 62,
        paddingLeft: 24,
        paddingRight: 24,
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
    >
      {/* Time */}
      <span className="relative" style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.3px' }}>
        9:41
      </span>
      {/* Status icons */}
      <div className="relative flex items-center" style={{ gap: 6 }}>
        {/* Signal */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <rect x="0" y="7" width="2.5" height="4" rx="0.6" fill="rgba(255,255,255,0.85)" />
          <rect x="4.5" y="4.5" width="2.5" height="6.5" rx="0.6" fill="rgba(255,255,255,0.85)" />
          <rect x="9" y="2" width="2.5" height="9" rx="0.6" fill="rgba(255,255,255,0.85)" />
          <rect x="13.5" y="0" width="2.5" height="11" rx="0.6" fill="rgba(255,255,255,0.85)" />
        </svg>
        {/* WiFi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <circle cx="7.5" cy="9.5" r="1.5" fill="rgba(255,255,255,0.85)" />
          <path d="M3.2 6C4.5 4.6 5.9 4 7.5 4s3 .6 4.3 2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M0.5 3C2.5 1.1 4.9 0 7.5 0s5 1.1 7 3" stroke="rgba(255,255,255,0.85)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <div style={{ width: 23, height: 11, border: '1px solid rgba(255,255,255,0.75)', borderRadius: 3, padding: '1.5px 2px', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '78%', height: '100%', background: 'rgba(255,255,255,0.85)', borderRadius: 1.5 }} />
          </div>
          <div style={{ width: 1.5, height: 5, background: 'rgba(255,255,255,0.55)', borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

// ── Controls ─────────────────────────────────────────────────────────────────

// ── Overview ──────────────────────────────────────────────────────────────────

function LightCard({ light, onToggle, onDetail, activeScene }: {
  light: LightSource;
  onToggle: (id: number) => void;
  onDetail: (light: LightSource) => void;
  activeScene: number;
}) {
  const p = (SCENE_CARD_PALETTES[activeScene] ?? SCENE_CARD_PALETTES[0])[light.blobGroup];
  const a = (rgb: string, op: number) => rgb.replace('rgb(', 'rgba(').replace(')', `,${op})`);

  const borderGradient = light.on
    ? `linear-gradient(135deg, rgba(255,255,255,0.38) 0%, ${a(p.fog, 0.28)} 38%, rgba(255,255,255,0.08) 65%, ${a(p.glow, 0.20)} 100%)`
    : `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)`;

  return (
    <div
      onClick={() => onDetail(light)}
      style={{
        borderRadius: 32,
        cursor: 'pointer', flexShrink: 0,
        boxShadow: light.on ? `0 0 28px 4px ${a(p.fog, 0.03)}` : 'none',
      }}
    >
      <div style={{
        position: 'relative', borderRadius: 32, overflow: 'hidden',
        background: 'transparent', height: 207,
      }}>
        {/* Blobs — always rendered, fade in/out */}
        <div style={{ opacity: light.on ? 1 : 0, transition: 'opacity 0.7s ease' }}>
          <CardBlobs palette={p} />
        </div>
        {/* Bottom vignette */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent 40%, rgb(6,4,10) 100%)' }} />
        {/* Power toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(light.id); }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 39, height: 39, borderRadius: '50%',
            background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 13 13" fill="none" style={{ transition: 'opacity 0.5s ease', opacity: light.on ? 1 : 0.42 }}>
            <path d="M4.2 2.0 A5.2 5.2 0 1 0 8.8 2.0" stroke="rgba(255,255,255,0.57)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <line x1="6.5" y1="0.5" x2="6.5" y2="5.8" stroke="rgba(255,255,255,0.57)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        {/* Label */}
        <div style={{
          position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center',
          fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.60)',
          opacity: light.on ? 1 : 0.36,
          transition: 'opacity 0.7s ease',
        }}>
          {light.name}
        </div>
        {/* White glass overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)' }} />
        {/* Gradient border — topmost, 1.3px, mask-composite technique */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 32, pointerEvents: 'none',
          padding: '1.3px',
          background: borderGradient,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        } as React.CSSProperties} />
      </div>
    </div>
  );
}

function OverviewSheet({ lights, onToggle, onClose, onDetail, activeScene }: {
  lights: LightSource[];
  onToggle: (id: number) => void;
  onClose: () => void;
  onDetail: (light: LightSource) => void;
  activeScene: number;
}) {
  const [isIn, setIsIn] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setIsIn(true)); }, []);
  const ease = 'cubic-bezier(0.32, 0.72, 0, 1)';

  const handleClose = () => { setIsIn(false); setTimeout(onClose, 380); };

  const scenePalette = SCENE_CARD_PALETTES[activeScene] ?? SCENE_CARD_PALETTES[0];
  const tint1 = scenePalette[2].fog;
  const tint2 = scenePalette[0].fog;
  const ta = (rgb: string, op: number) => rgb.replace('rgb(', 'rgba(').replace(')', `,${op})`);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: [
        `radial-gradient(ellipse 70% 55% at 25% 35%, ${ta(tint1, 0.07)} 0%, transparent 70%)`,
        `radial-gradient(ellipse 55% 45% at 75% 65%, ${ta(tint2, 0.05)} 0%, transparent 65%)`,
        'linear-gradient(to bottom, rgb(14,10,22) 0%, rgb(10,7,16) 100%)',
      ].join(', '),
      opacity: isIn ? 1 : 0,
      transform: isIn ? 'translateY(0px)' : 'translateY(56px)',
      filter: isIn ? 'blur(0px)' : 'blur(14px)',
      transition: `opacity 0.34s ${ease}, transform 0.34s ${ease}, filter 0.34s ${ease}`,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ height: 109, display: 'flex', alignItems: 'flex-end', paddingLeft: 16, paddingRight: 16, flexShrink: 0 }}>
        <button
          onClick={handleClose}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none" style={{ marginLeft: -4 }}>
            <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="rgba(255,255,255,0.88)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{
          flex: 1, textAlign: 'center', marginRight: 44,
          fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.2px',
          marginBottom: 12,
        }}>
          Все источники
        </span>
      </div>

      {/* Scrollable grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px 12px 40px',
        maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {lights.map((light, i) => {
            const row = Math.floor(i / 2);
            const delay = `${60 + row * 70}ms`;
            return (
              <div
                key={light.id}
                style={{
                  opacity:   isIn ? 1 : 0,
                  transform: isIn ? 'translateY(0px)' : 'translateY(22px)',
                  filter:    isIn ? 'blur(0px)' : 'blur(8px)',
                  transition: `opacity 0.55s ${ease} ${delay}, transform 0.55s ${ease} ${delay}, filter 0.50s ${ease} ${delay}`,
                }}
              >
                <LightCard light={light} onToggle={onToggle} onDetail={onDetail} activeScene={activeScene} />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function Controls({ onOverview }: { onOverview: () => void }) {
  const glassBase: React.CSSProperties = {
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '0.5px solid rgba(255,255,255,0.18)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.22)',
    cursor: 'pointer',
  };
  const iconColor = 'rgba(255,255,255,0.82)';
  return (
    <div style={{ position: 'absolute', left: 0, top: 65, width: 402, height: 44, zIndex: 20 }} onPointerDown={e => e.stopPropagation()}>

      {/* Left — 44×44 circle, 16px from left edge */}
      <button onClick={onOverview} style={{ ...glassBase, position: 'absolute', left: 16, top: 0, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,200,220,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="0"   y="0"   width="7.5" height="7.5" rx="2.2" fill={iconColor} />
          <rect x="10.5" y="0"  width="7.5" height="7.5" rx="2.2" fill={iconColor} />
          <rect x="0"   y="10.5" width="7.5" height="7.5" rx="2.2" fill={iconColor} />
          <rect x="10.5" y="10.5" width="7.5" height="7.5" rx="2.2" fill={iconColor} />
        </svg>
      </button>

      {/* Center — true center of screen */}
      <span style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.2px', pointerEvents: 'none' }}>
        Гостиная
      </span>

      {/* Right — single round button with sun icon */}
      <button style={{ ...glassBase, position: 'absolute', right: 16, top: 0, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,200,220,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="3.2" fill={iconColor} />
          <line x1="10" y1="0.5"  x2="10" y2="4"   stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="10" y1="16"   x2="10" y2="19.5" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="0.5"  y1="10" x2="4"   y2="10" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="16"   y1="10" x2="19.5" y2="10" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="3.1" y1="3.1"   x2="5.6"  y2="5.6"  stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="14.4" y1="14.4" x2="16.9" y2="16.9" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="16.9" y1="3.1"  x2="14.4" y2="5.6"  stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="5.6"  y1="14.4" x2="3.1"  y2="16.9" stroke={iconColor} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

    </div>
  );
}

// ── Bottom tray ───────────────────────────────────────────────────────────────

function BottomTray({ activeScene, logPos, onSceneChange, onNewStyle }: {
  activeScene: number;
  logPos: number;
  onSceneChange: (i: number) => void;
  onNewStyle: () => void;
}) {
  const dragX = useRef<number | null>(null);
  const onStart = (x: number) => { dragX.current = x; };
  const onEnd   = (x: number) => {
    if (dragX.current === null) return;
    const dx = x - dragX.current;
    dragX.current = null;
    if (dx < -45) onSceneChange((activeScene + 1) % N);
    if (dx >  45) onSceneChange((activeScene - 1 + N) % N);
  };

  return (
    <div
      className="absolute left-0 right-0 z-10 pb-8 pt-4" style={{ bottom: -18 }}
      onTouchStart={e => onStart(e.touches[0].clientX)}
      onTouchEnd={e   => onEnd(e.changedTouches[0].clientX)}
      onMouseDown={e  => onStart(e.clientX)}
      onMouseUp={e    => onEnd(e.clientX)}
    >

      {/* Arc carousel — 7 slots keyed by absolute position, ±3 invisible */}
      <div className="relative w-full" style={{ height: 108, marginTop: 40 }}>
        {([-3, -2, -1, 0, 1, 2, 3]).map((d) => {
          const k        = logPos + d;
          const sceneIdx = posToIdx(k);
          const scene    = SCENES[sceneIdx];
          const absDist  = Math.abs(d);
          const sz = absDist === 0 ? 68 : absDist === 1 ? 57 : 52;
          const op = absDist === 0 ? 1 : absDist === 1 ? 0.60 : absDist === 2 ? 0.36 : 0;

          const angleRad = d * ARC_STEP * (Math.PI / 180);
          const arcDx = ARC_R * Math.sin(angleRad);
          const arcDy = ARC_R * (1 - Math.cos(angleRad));

          return (
            <div
              key={k}
              className="absolute"
              style={{
                width:         sz,
                height:        sz,
                left:          `calc(50% + ${arcDx}px - ${sz / 2}px)`,
                top:           arcDy,
                opacity:       op,
                pointerEvents: op === 0 ? 'none' : 'auto',
                transition:    "all 0.5s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {/* Blurred gradient glow — multicolor, matches sphere */}
              <div style={{
                position:      'absolute',
                borderRadius:  '50%',
                background:    scene.sphere.gradient,
                filter:        'blur(13px)',
                opacity:       d === 0 ? 0.36 : 0,
                width:         '115%',
                height:        '115%',
                top:           '-8%',
                left:          '-8%',
                pointerEvents: 'none',
                transition:    'opacity 0.5s ease',
              }} />
              <button
                onClick={() => onSceneChange(sceneIdx)}
                className="relative rounded-full overflow-hidden outline-none w-full h-full"
                style={{
                  background: scene.sphere.gradient,
                  boxShadow:  scene.sphere.glassInset ?? "none",
                  filter: (sceneIdx === 3 || sceneIdx === 1)
                    ? 'saturate(1.15) contrast(1.10) brightness(1.05)'
                    : (d === 0 && sceneIdx === 0 ? 'saturate(1.15) brightness(1.10) contrast(1.05)' : undefined),
                }}
              >
                <span
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    top: "13%", left: "14%",
                    width: "37%", height: "24%",
                    background: "rgba(255,255,255,0.52)",
                    filter: "blur(5px)",
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Новый стиль */}
      <div className="flex justify-center" style={{ marginTop: -4 }}>
        <button
          style={{
            height:               44,
            padding:              "0 22px",
            display:              "flex",
            alignItems:           "center",
            gap:                  10,
            borderRadius:         22,
            background:           "rgba(255,200,220,0.10)",
            border:               "0.5px solid rgba(255,255,255,0.18)",
            backdropFilter:       "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            boxShadow:            "inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.22)",
            color:                "rgba(255,255,255,0.88)",
            cursor:               "pointer",
          }}
          onClick={onNewStyle}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 0 C8 0 8.8 5.2 16 8 C8.8 10.8 8 16 8 16 C8 16 7.2 10.8 0 8 C7.2 5.2 8 0 8 0Z" fill="rgba(255,255,255,0.85)" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.1px" }}>Новый стиль</span>
        </button>
      </div>

      {/* Grabber — Figma: x=183, y=855, w=36, h=5 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 34 }}>
        <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(204,204,204,0.50)' }} />
      </div>
    </div>
  );
}
