"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from 'next/dynamic';

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


const W = 402;
const H = 834;

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
  { x:183, y:208, w:91,  h:91,  blur:22,  blend:'screen', op:0.32, bg:'radial-gradient(circle, rgb(255,238,155) 0%, rgba(255,0,4,0) 100%)' },
  { x:205, y:230, w:46,  h:46,  blur:11,  blend:'screen', op:0.32, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,245,200,0) 100%)' },
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
  { x:240, y:485, w:91,  h:91,  blur:17,  blend:'screen', op:0.32, bg:'radial-gradient(circle, rgb(255,238,155) 0%, rgba(255,0,4,0) 100%)' },
  { x:262, y:507, w:46,  h:46,  blur:8,   blend:'screen', op:0.32, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,245,200,0) 100%)' },
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
  { x:75,  y:378, w:91,  h:91,  blur:22,  blend:'screen', op:0.32, bg:'radial-gradient(circle, rgb(255,238,155) 0%, rgba(255,0,80,0) 100%)' },
  { x:97,  y:400, w:46,  h:46,  blur:11,  blend:'screen', op:0.32, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,245,200,0) 100%)' },
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
  { x:183, y:208, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(255,225,130) 0%, rgba(255,155,10,0) 100%)' },
  { x:205, y:230, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(255,250,230) 0%, rgba(255,220,150,0) 100%)' },
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
  { x:240, y:485, w:91,  h:91,  blur:17,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(255,200,100) 0%, rgba(255,75,10,0) 100%)' },
  { x:262, y:507, w:46,  h:46,  blur:8,   blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(255,248,235) 0%, rgba(255,225,175,0) 100%)' },
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
  { x:75,  y:378, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(235,140,230) 0%, rgba(100,20,180,0) 100%)' },
  { x:97,  y:400, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(255,215,245) 0%, rgba(220,200,255,0) 100%)' },
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
  { x:183, y:208, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(252,250,216) 0%, rgba(240,224,132,0) 100%)' },
  { x:205, y:230, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(255,255,248) 0%, rgba(250,245,225,0) 100%)' },
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
  { x:240, y:485, w:91,  h:91,  blur:17,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(247,230,218) 0%, rgba(218,143,119,0) 100%)' },
  { x:262, y:507, w:46,  h:46,  blur:8,   blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(255,250,246) 0%, rgba(246,228,219,0) 100%)' },
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
  { x:75,  y:378, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(214,230,244) 0%, rgba(112,157,207,0) 100%)' },
  { x:97,  y:400, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(242,250,255) 0%, rgba(222,236,246,0) 100%)' },
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
  { x:183, y:208, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(165,248,195) 0%, rgba(10,190,70,0) 100%)' },
  { x:205, y:230, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(218,252,228) 0%, rgba(165,245,195,0) 100%)' },
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
  { x:240, y:485, w:91,  h:91,  blur:17,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(108,175,90) 0%, rgba(32,110,22,0) 100%)' },
  { x:262, y:507, w:46,  h:46,  blur:8,   blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(162,215,148) 0%, rgba(108,175,90,0) 100%)' },
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
  { x:75,  y:378, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(205,242,140) 0%, rgba(100,185,30,0) 100%)' },
  { x:97,  y:400, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(235,248,205) 0%, rgba(215,240,172,0) 100%)' },
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
  { x:183, y:208, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(168,238,248) 0%, rgba(0,195,212,0) 100%)' },
  { x:205, y:230, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(218,248,252) 0%, rgba(168,240,250,0) 100%)' },
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
  { x:240, y:485, w:91,  h:91,  blur:17,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(185,185,255) 0%, rgba(70,70,240,0) 100%)' },
  { x:262, y:507, w:46,  h:46,  blur:8,   blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(222,222,255) 0%, rgba(205,205,255,0) 100%)' },
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
  { x:75,  y:378, w:91,  h:91,  blur:22,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(200,165,252) 0%, rgba(108,18,230,0) 100%)' },
  { x:97,  y:400, w:46,  h:46,  blur:11,  blend:'screen', op:0.4, bg:'radial-gradient(circle, rgb(230,220,255) 0%, rgba(218,202,255,0) 100%)' },
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

function CardBlobs({ palette, brightness = 1 }: { palette: CardPalette; brightness?: number }) {
  const p = palette;
  return (
    <div style={{ position: 'absolute', inset: 0, filter: `saturate(1.3) contrast(1.1) brightness(${brightness.toFixed(2)})`, transform: 'translateY(-32px)' }}>
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
    { x:160, y:240, w:91,  h:91,  blur:22,  blend:'screen',      op:0.4, bg:rad(p.core, a(p.glow, 0)) },
    { x:183, y:263, w:46,  h:46,  blur:11,  blend:'screen',      op:0.4, bg:'radial-gradient(circle, rgb(255,252,242) 0%, rgba(255,250,235,0) 100%)' },
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

// Custom scene inserted into the carousel when photo style is created
// Gradient for the custom sphere ball — yellow/pink on red structure + Сияние curl
const CUSTOM_SPHERE_GRADIENT = [
  "radial-gradient(ellipse 42% 30% at 22% 20%, rgb(255,218,52) 0%, rgba(255,190,40,0.55) 45%, transparent 72%)",
  "radial-gradient(ellipse at 32% 48%, rgb(255,175,78) 0%, transparent 42%)",
  "radial-gradient(ellipse at 52% 52%, rgb(238,65,140) 0%, transparent 38%)",
  "radial-gradient(ellipse 68% 20% at 36% 42%, rgba(255,198,78,0.65) 0%, rgba(255,158,55,0.18) 62%, transparent 85%)",
  "radial-gradient(ellipse at 80% 18%, rgb(158,18,108) 0%, transparent 44%)",
  "radial-gradient(ellipse 28% 55% at 90% 52%, rgb(108,8,78) 0%, transparent 60%)",
  "radial-gradient(ellipse at 18% 78%, rgb(218,148,38) 0%, transparent 42%)",
  "radial-gradient(ellipse at 78% 80%, rgb(98,8,68) 0%, transparent 44%)",
  "rgb(68,6,42)",
].join(', ');

// Custom scene — inserted into the carousel after photo style is created
const CUSTOM_SCENE: SceneDef = {
  name: 'Мой стиль',
  blobs: [
    { halo: [255,80,160] as RGB, rim: [255,150,60] as RGB, bodyOuter: [220,100,180] as RGB, bodyInner: [255,180,80] as RGB, core: [255,248,230] as RGB },
    { halo: [255,80,160] as RGB, rim: [255,150,60] as RGB, bodyOuter: [220,100,180] as RGB, bodyInner: [255,180,80] as RGB, core: [255,248,230] as RGB },
    { halo: [130,20,180] as RGB, rim: [200,60,220] as RGB, bodyOuter: [160,40,200] as RGB, bodyInner: [190,70,220] as RGB, core: [230,190,255] as RGB },
  ],
  sphere: { gradient: CUSTOM_SPHERE_GRADIENT, glow: '0 0 18px 6px rgba(255,180,60,.13)' },
  panelColor: [22, 7, 15] as RGB,
};

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

function StylePickerSheet({ onClose, onFromPhoto, forcedExit = false }: { onClose: () => void; onFromPhoto: () => void; forcedExit?: boolean }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (forcedExit && !exiting) { setExiting(true); setTimeout(onClose, 340); }
  }, [forcedExit]);

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
          const hov = hoveredIdx === i && i === 0;
          const handleClick = i === 0 ? onFromPhoto : undefined;
          return (
            <div
              key={i}
              onClick={handleClick}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 24,
                opacity:    isIn ? 1 : 0,
                transform:  isIn ? 'translateY(0px)' : 'translateY(44px)',
                filter:     isIn ? 'blur(0px)' : 'blur(12px)',
                transition: `opacity 0.42s ${ease} ${delay}, transform 0.42s ${ease} ${delay}, filter 0.38s ${ease} ${delay}`,
                cursor: i === 0 ? 'pointer' : 'default',
              }}
            >
              <div style={{
                position: 'relative', flexShrink: 0, width: 86, height: 86,
                filter: hov
                  ? 'saturate(1.30) contrast(1.05) brightness(1.10)'
                  : 'saturate(1.15) contrast(1.05)',
                transition: 'filter 0.22s ease',
              }}>
                {/* Glow 1 — большое размытие */}
                <div style={{
                  position: 'absolute', inset: hov ? -34 : -32, borderRadius: '50%', pointerEvents: 'none',
                  background: item.src ? `url(${item.src}) center/cover no-repeat` : item.gradient,
                  filter: 'blur(28px)', opacity: hov ? 0.16 : 0.14,
                  transition: 'inset 0.22s ease, opacity 0.22s ease',
                }} />
                {/* Glow 2 — среднее размытие */}
                <div style={{
                  position: 'absolute', inset: hov ? -15 : -14, borderRadius: '50%', pointerEvents: 'none',
                  background: item.src ? `url(${item.src}) center/cover no-repeat` : item.gradient,
                  filter: 'blur(10px)', opacity: hov ? 0.28 : 0.26,
                  transition: 'inset 0.22s ease, opacity 0.22s ease',
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

        // Rise ~0.5s, fall ~2s
        const speed = heat.current[i] < target ? 0.030 : 0.010;
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

        div.style.opacity  = (h * 0.90).toFixed(3);
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

// Layer group splits: G0=9 layers (blobGroup 2, top), G1=10 (blobGroup 1, right), G2=10 (blobGroup 0, left)
const BLOB_LAYER_SPLIT: [number, number] = [9, 19];
// For each layer group: which blobGroup it belongs to, and its center in layer-space
const LAYER_META: { blobGroup: 0|1|2; ox: number; oy: number }[] = [
  { blobGroup: 2, ox: 228, oy: 253 },
  { blobGroup: 1, ox: 285, oy: 530 },
  { blobGroup: 0, ox: 120, oy: 423 },
];

function CSSBlobsV1({ sceneIdx, groupBrightness, groupCustomHues, groupSaturations }: {
  sceneIdx: number;
  groupBrightness: [number, number, number];
  groupCustomHues: (number | null)[];
  groupSaturations: (number | null)[];
}) {
  const scenePalettes = SCENE_CARD_PALETTES[sceneIdx] ?? SCENE_CARD_PALETTES[0];
  const groups = LAYER_META.map(({ blobGroup }) => {
    const ch = groupCustomHues[blobGroup];
    const palette = ch !== null && ch !== undefined
      ? hueToPalette(ch, (groupSaturations[blobGroup] ?? 72) / 100)
      : scenePalettes[blobGroup];
    const dx = BLOB_CORE_CENTERS[blobGroup][0] - DETAIL_BLOB_CENTER[0];
    const dy = BLOB_CORE_CENTERS[blobGroup][1] - DETAIL_BLOB_CENTER[1];
    return buildDetailLayers(palette).map(l => ({ ...l, x: l.x + dx, y: l.y + dy }));
  });

  const hoverRef           = useRef([0, 0, 0]);
  const groupRefs          = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const containerRef       = useRef<HTMLDivElement>(null);
  const cursorRef          = useRef({ x: -9999, y: -9999 });
  const groupBrightnessRef = useRef(groupBrightness);
  groupBrightnessRef.current = groupBrightness;
  const groupCustomHuesRef   = useRef(groupCustomHues);
  groupCustomHuesRef.current = groupCustomHues;
  const groupSaturationsRef  = useRef(groupSaturations);
  groupSaturationsRef.current = groupSaturations;
  const defaultSat = sceneIdx === 3 ? 1.04 : 1.3;

  useEffect(() => {
    let rafId = 0;
    const RADIUS = 130;
    const RISE   = 0.08;
    const FALL   = 0.016;

    const onMove = (e: MouseEvent) => {
      const r = containerRef.current?.parentElement?.getBoundingClientRect();
      if (!r) return;
      cursorRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { cursorRef.current = { x: -9999, y: -9999 }; };

    const tick = () => {
      LAYER_META.forEach(({ blobGroup }, gi) => {
        const [cx, cy] = BLOB_CORE_CENTERS[blobGroup];
        const dist  = Math.hypot(cursorRef.current.x - cx, cursorRef.current.y - cy);
        const tgt   = dist < RADIUS ? 1 : 0;
        const cur   = hoverRef.current[gi];
        hoverRef.current[gi] = cur + (tgt - cur) * (tgt > cur ? RISE : FALL);

        const div = groupRefs.current[gi];
        if (!div) return;
        const h      = hoverRef.current[gi];
        const baseBr = groupBrightnessRef.current[blobGroup];
        const brStr  = baseBr < 0.999 ? `brightness(${baseBr.toFixed(3)}) ` : '';
        const ch     = groupCustomHuesRef.current[blobGroup];
        const satVal = ch !== null && ch !== undefined
          ? lerp(0, 2, (groupSaturationsRef.current[blobGroup] ?? 72) / 100)
          : defaultSat;
        const satStr = `saturate(${satVal.toFixed(3)}) `;
        if (h < 0.002) { div.style.filter = (satStr + brStr).trim(); div.style.transform = ''; return; }
        div.style.filter    = `${satStr}${brStr}saturate(${(1 + 0.18 * h).toFixed(3)}) brightness(${(1 + 0.07 * h).toFixed(3)})`;
        div.style.transform = `scale(${(1 + 0.08 * h).toFixed(4)})`;
      });
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', filter: 'contrast(1.1)' }}
    >
      {groups.map((layers, gi) => (
        <div
          key={gi}
          ref={el => { groupRefs.current[gi] = el; }}
          style={{
            position: 'absolute', inset: 0,
            transformOrigin: `${LAYER_META[gi].ox}px ${LAYER_META[gi].oy}px`,
            willChange: 'transform, filter',
            pointerEvents: 'none',
          }}
        >
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
      ))}
    </div>
  );
}

// ── Blob V2 ──────────────────────────────────────────────────────────────────

const BLOB_V2_CENTER = [225, 231] as const;
const BLOB_V2_SIZE   = 580;

const ShaderBlobV2 = dynamic(
  () => import('shaders/react').then(({
    Shader: SShader,
    MultiPointGradient: SMPG,
    WaveDistortion: SWave,
    Bulge: SBulge,
    Paper: SPaper,
    ChromaticAberration: SCA,
  }) => {
    function ShaderBlobV2Impl() {
      const half = BLOB_V2_SIZE / 2;
      const mask = 'radial-gradient(circle, black 8%, rgba(0,0,0,0.55) 22%, rgba(0,0,0,0.08) 38%, transparent 48%)';
      return (
        <div style={{
          position: 'absolute',
          left: BLOB_V2_CENTER[0] - half,
          top:  BLOB_V2_CENTER[1] - half,
          width: BLOB_V2_SIZE,
          height: BLOB_V2_SIZE,
          maskImage: mask,
          WebkitMaskImage: mask,
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          <SShader style={{ position: 'absolute', inset: 0 }}>
            <SMPG
              colorA="#ffeedd"
              colorB="#ff6633"
              colorC="#ff4422"
              colorD="#ff7744"
              colorE="#ff5533"
              positionA={{
                type: 'mouse-position' as const,
                originX: 0.5,
                originY: 0.5,
                momentum: 0.1,
                smoothing: 0.95,
                reach: 0.06,
              }}
              smoothness={4}
              positionB={{
                type: 'mouse-position' as const,
                originX: 0.78,
                originY: 0.72,
                momentum: 0.2,
                smoothing: 0.85,
                reach: 0.18,
              }}
              positionC={{
                type: 'mouse-position' as const,
                originX: 0.22,
                originY: 0.74,
                momentum: 0.2,
                smoothing: 0.82,
                reach: 0.16,
              }}
              positionD={{
                type: 'mouse-position' as const,
                originX: 0.50,
                originY: 0.20,
                momentum: 0.25,
                smoothing: 0.80,
                reach: 0.20,
              }}
              positionE={{
                type: 'mouse-position' as const,
                originX: 0.82,
                originY: 0.26,
                momentum: 0.18,
                smoothing: 0.88,
                reach: 0.15,
              }}
            />
            <SWave
              angle={264}
              frequency={0.7}
              speed={0.45}
              waveType="triangle"
              strength={0.3}
            />
            <SBulge
              center={{
                type: 'mouse-position' as const,
                originX: 0.5,
                originY: 0.5,
                momentum: 0.15,
                smoothing: 0.9,
                reach: 0.14,
              }}
              falloff={0.85}
              radius={0.75}
              strength={0.55}
            />
            <SPaper displacement={0.9} grainScale={3} roughness={0.1} />
            <SCA />
          </SShader>
        </div>
      );
    }
    return { default: ShaderBlobV2Impl };
  }),
  { ssr: false }
);

// ── ShaderDetailBg — ambient shader for SourceDetailScreen ───────────────────

const ShaderDetailBg = dynamic(
  () => import('shaders/react').then(({
    Shader: SShader,
    Aurora: SAurora,
    LensFlare: SLensFlare,
    FilmGrain: SFG,
  }) => {
    function ShaderDetailBgImpl({ hue }: { hue: number }) {
      const colorA = hslToRgb(hue - 30, 90, 55);
      const colorB = hslToRgb(hue,      100, 68);
      const colorC = hslToRgb(hue + 30, 90, 60);
      return (
        <SShader style={{ position: 'absolute', inset: 0 }}>
          <SAurora
            colorA={colorA}
            colorB={colorB}
            colorC={colorC}
            colorSpace="oklab"
            curtainCount={3}
            intensity={90}
            waviness={65}
            rayDensity={15}
            height={150}
            speed={3}
            center={{
              type: 'mouse-position' as const,
              originX: 0.5,
              originY: 0.5,
              reach: 0.28,
              smoothing: 0.82,
              momentum: 0.2,
            }}
            blendMode="screen"
          />
          <SLensFlare
            lightPosition={{
              type: 'mouse-position' as const,
              originX: 0.5,
              originY: 0.38,
              reach: 0.4,
              smoothing: 0.72,
              momentum: 0.3,
            }}
            intensity={0.55}
            ghostIntensity={0.45}
            ghostChroma={0.7}
            haloIntensity={0.5}
            haloChroma={0.85}
            haloSoftness={0.9}
            starburstIntensity={0.35}
            starburstPoints={6}
            streakIntensity={0.18}
            glareIntensity={0.28}
            glareSize={0.5}
            speed={0.5}
            blendMode="screen"
          />
          <SFG />
        </SShader>
      );
    }
    return { default: ShaderDetailBgImpl };
  }),
  { ssr: false }
);

// ── ShaderDetailCA — chromatic aberration overlay for SourceDetailScreen ────────

const DETAIL_CA_SIZE = 480;

const ShaderDetailCA = dynamic(
  () => import('shaders/react').then(({
    Shader: SShader,
    MultiPointGradient: SMPG,
    ChromaticAberration: SCA,
  }) => {
    function ShaderDetailCAImpl({ hue, saturation }: { hue: number; saturation: number }) {
      const colorA = hslToRgb(hue,       33 * saturation, 68);
      const colorB = hslToRgb(hue - 28,  33 * saturation, 58);
      const colorC = hslToRgb(hue + 32,  32 * saturation, 54);
      const colorD = hslToRgb(hue - 55,  29 * saturation, 46);
      const colorE = hslToRgb(hue + 60,  27 * saturation, 42);
      const half = DETAIL_CA_SIZE / 2;
      const mask = 'radial-gradient(circle, black 10%, rgba(0,0,0,0.6) 28%, rgba(0,0,0,0.1) 50%, transparent 65%)';
      return (
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - half,
          top:  DETAIL_BLOB_CENTER[1] - half,
          width: DETAIL_CA_SIZE,
          height: DETAIL_CA_SIZE,
          maskImage: mask,
          WebkitMaskImage: mask,
          mixBlendMode: 'screen',
          opacity: 0.33,
          filter: `saturate(${(saturation * 2).toFixed(2)})`,
          pointerEvents: 'none',
        }}>
          <SShader style={{ position: 'absolute', inset: 0 }}>
            <SMPG
              colorA={colorA}
              colorB={colorB}
              colorC={colorC}
              colorD={colorD}
              colorE={colorE}
              smoothness={3}
              positionA={{ type: 'mouse-position' as const, originX: 0.5,  originY: 0.5,  momentum: 0.1,  smoothing: 0.92, reach: 0.06 }}
              positionB={{ type: 'mouse-position' as const, originX: 0.34, originY: 0.38, momentum: 0.2,  smoothing: 0.85, reach: 0.22 }}
              positionC={{ type: 'mouse-position' as const, originX: 0.66, originY: 0.40, momentum: 0.2,  smoothing: 0.82, reach: 0.20 }}
              positionD={{ type: 'mouse-position' as const, originX: 0.3,  originY: 0.72, momentum: 0.24, smoothing: 0.80, reach: 0.18 }}
              positionE={{ type: 'mouse-position' as const, originX: 0.7,  originY: 0.70, momentum: 0.18, smoothing: 0.88, reach: 0.16 }}
            />
            <SCA strength={0.5} angle={hue} redOffset={-1} greenOffset={0} blueOffset={1} />
          </SShader>
        </div>
      );
    }
    return { default: ShaderDetailCAImpl };
  }),
  { ssr: false }
);

// ── ShaderDetailBlob — organic morphing blob overlay for SourceDetailScreen ───

const DETAIL_BLOB_SHADER_SIZE = 520;

const ShaderDetailBlob = dynamic(
  () => import('shaders/react').then(({ Shader: SShader, Blob: SBlob }) => {
    function ShaderDetailBlobImpl({ hue, saturation }: { hue: number; saturation: number }) {
      const colorA = hslToRgb(hue,      88 * saturation, 58);
      const colorB = hslToRgb(hue + 30, 80 * saturation, 46);
      const half = DETAIL_BLOB_SHADER_SIZE / 2;
      const mask = 'radial-gradient(circle, black 18%, rgba(0,0,0,0.5) 42%, rgba(0,0,0,0.08) 62%, transparent 75%)';
      return (
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - half,
          top:  DETAIL_BLOB_CENTER[1] - half,
          width: DETAIL_BLOB_SHADER_SIZE,
          height: DETAIL_BLOB_SHADER_SIZE,
          maskImage: mask,
          WebkitMaskImage: mask,
          mixBlendMode: 'screen',
          opacity: 0.45,
          filter: `saturate(${(saturation * 2).toFixed(2)})`,
          pointerEvents: 'none',
        }}>
          <SShader style={{ position: 'absolute', inset: 0 }}>
            <SBlob
              colorA={colorA}
              colorB={colorB}
              size={0.72}
              deformation={0.58}
              softness={0.65}
              speed={0.28}
              highlightIntensity={0.3}
              seed={42}
            />
          </SShader>
        </div>
      );
    }
    return { default: ShaderDetailBlobImpl };
  }),
  { ssr: false }
);

// ── ShaderDetailGrain — subtle film grain for SourceDetailScreen ─────────────

const ShaderDetailGrain = dynamic(
  () => import('shaders/react').then(({ Shader: SShader, FilmGrain: SFG }) => {
    function ShaderDetailGrainImpl() {
      return (
        <SShader style={{ position: 'absolute', inset: 0 }}>
          <SFG strength={0.22} bias={1} animated />
        </SShader>
      );
    }
    return { default: ShaderDetailGrainImpl };
  }),
  { ssr: false }
);

// ── Shader glass overlay (Glass + Swirl + CursorRipples, scene-reactive) ──────

const ShaderOverlay = dynamic(
  () => import('shaders/react').then(({
    Blob: SBlob,
    ChromaticAberration: SCA,
    CursorRipples: SCursorRipples,
    FilmGrain: SFilmGrain,
    Glass: SGlass,
    Shader: SShader,
    Swirl: SSwirl,
  }) => {
    function ShaderOverlayImpl({ sceneIdx, cursorColorA, cursorColorB, caAngle, caRed, caGreen, caBlue }: {
      sceneIdx: number;
      cursorColorA: string;
      cursorColorB: string;
      caAngle: number;
      caRed: number;
      caGreen: number;
      caBlue: number;
    }) {
      const scene = SCENES[sceneIdx];
      const [r1, g1, b1] = scene.blobs[2].rim;
      const [r2, g2, b2] = scene.blobs[0].halo;
      const sceneColorA = `rgb(${r1},${g1},${b1})`;
      const sceneColorB = `rgb(${r2},${g2},${b2})`;
      return (
        <SShader style={{ position: 'absolute', inset: 0 }}>
          <SGlass
            cutout={false}
            edgeSoftness={0.55}
            fresnel={0.06}
            fresnelColor={sceneColorA}
            fresnelSoftness={0.4}
            highlight={0.07}
            highlightColor={sceneColorB}
            highlightSoftness={0.3}
            lightAngle={289}
            refraction={0.2}
            scale={1.8}
            thickness={0.2}
            opacity={0.45}
            visible={true}
          >
            <SSwirl
              blend={45}
              colorA={sceneColorA}
              colorB={sceneColorB}
              colorSpace="oklab"
              detail={3.5}
              speed={0.05}
              opacity={0.1}
            />
            <SBlob
              blendMode="linearDodge"
              center={{
                type: 'mouse-position' as const,
                reach: 0.55,
                originX: 0.5,
                originY: 0.5,
                momentum: 0.3,
                smoothing: 0.3,
              }}
              colorA={cursorColorA}
              colorB={cursorColorB}
              highlightIntensity={0}
              deformation={0.9}
              size={0.09}
              softness={0.7}
            />
            <SCA strength={0.65} angle={caAngle} redOffset={caRed} greenOffset={caGreen} blueOffset={caBlue} />
            <SCursorRipples
              chromaticSplit={6}
              decay={5}
              intensity={20}
              radius={0.5}
              visible={true}
            />
          </SGlass>
          <SFilmGrain strength={0.04} visible={true} />
        </SShader>
      );
    }
    return { default: ShaderOverlayImpl };
  }),
  { ssr: false }
);

// ── Source detail screen ──────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

function hslToRgb(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255);
  return `rgb(${f(0)},${f(8)},${f(4)})`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
          : max === g ? ((b - r) / d + 2) / 6
                      : ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hueToRgbNums(hue: number): [number, number, number] {
  const h = ((hue % 360) + 360) % 360;
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => Math.round((0.5 - 0.5 * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))) * 255);
  return [f(0), f(8), f(4)];
}

function analogousOffsets(hue: number): [number, number, number] {
  const SPREAD = 28;
  const [rp, gp, bp] = hueToRgbNums(hue + SPREAD);
  const [rm, gm, bm] = hueToRgbNums(hue - SPREAD);
  const dr = rp - rm, dg = gp - gm, db = bp - bm;
  const maxD = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db)) || 1;
  return [dr / maxD, dg / maxD, db / maxD];
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

function hueToPalette(h: number, sat = 1): CardPalette {
  return {
    fog:  hslToRgb(h, 100 * sat, 48),
    glow: hslToRgb(h, 100 * sat, 50),
    core: 'rgb(255,238,155)',
    ab1:  hslToRgb(h - 40, 90 * sat, 42),
    ab2:  hslToRgb(h + 15, 80 * sat, 62),
  };
}

// Visual center of the detail-screen blob (used as transform-origin for transition)
const DETAIL_BLOB_CENTER: [number, number] = [205, 285];

function SourceDetailScreen({
  light, sceneIdx, onClose, onSave, fromCardRect, onBrightnessChange, onHueChange, onToggle, hideBlob,
}: {
  light: LightSource;
  sceneIdx: number;
  onClose: () => void;
  onSave: (updates: SceneLightSettings) => void;
  fromCardRect?: DOMRect;
  onBrightnessChange?: (b: number) => void;
  onHueChange?: (hue: number) => void;
  onToggle?: () => void;
  hideBlob?: boolean;
}) {
  const [isOn, setIsOn] = useState(light.on);
  const [phase, setPhase] = useState<'entering' | 'open' | 'exiting'>('entering');

  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setPhase('open'));
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, []);

  const handleClose = () => {
    setTimeout(() => {
      setPhase('exiting');
      setTimeout(onClose, fromCardRect ? 260 : 620);
    }, 500);
  };

  const scenePalette = (SCENE_CARD_PALETTES[sceneIdx] ?? SCENE_CARD_PALETTES[0])[light.blobGroup];
  const sceneData = light.sceneSettings?.[sceneIdx];
  const initBrightness = (sceneData?.brightness ?? light.brightness) / 100;
  const initHue = ((Math.round((sceneData?.customHue ?? rgbToHue(scenePalette.fog)) / 2) * 2) % 360 + 360) % 360;
  const initSaturation = (sceneData?.customSaturation ?? 72) / 100;
  const [saturation, setSaturation] = useState(initSaturation);
  const saturationRef = useRef(initSaturation);

  const [grabberDrag, setGrabberDrag] = useState(0); // px pulled down
  const grabberDragRef = useRef(0);
  const grabberActive  = useRef(false);
  const grabberStartY  = useRef(0);
  const grabberSnapRAF = useRef<number | null>(null);

  const onGrabberDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    grabberActive.current = true;
    grabberStartY.current = e.clientY;
    grabberDragRef.current = 0;
    if (grabberSnapRAF.current !== null) { cancelAnimationFrame(grabberSnapRAF.current); grabberSnapRAF.current = null; }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onGrabberMove = useCallback((e: React.PointerEvent) => {
    if (!grabberActive.current) return;
    const dy = Math.max(0, e.clientY - grabberStartY.current);
    grabberDragRef.current = dy;
    setGrabberDrag(dy);
  }, []);

  const onGrabberUp = useCallback(() => {
    if (!grabberActive.current) return;
    grabberActive.current = false;
    if (grabberDragRef.current > 80) {
      handleClose();
      return;
    }
    // Snap back
    const snap = () => {
      const cur = grabberDragRef.current;
      if (cur < 1) { grabberDragRef.current = 0; setGrabberDrag(0); grabberSnapRAF.current = null; return; }
      const next = cur * 0.75;
      grabberDragRef.current = next;
      setGrabberDrag(next);
      grabberSnapRAF.current = requestAnimationFrame(snap);
    };
    grabberSnapRAF.current = requestAnimationFrame(snap);
  }, [handleClose]);

  const [brightness, setBrightness] = useState(initBrightness);
  const brightnessRef  = useRef(initBrightness);
  const brightDrag     = useRef({ active: false, startY: 0, startVal: initBrightness });
  const brightSamples  = useRef<Array<{ y: number; t: number }>>([]);
  const brightInertia  = useRef<number | null>(null);

  const cancelBrightInertia = useCallback(() => {
    if (brightInertia.current !== null) {
      cancelAnimationFrame(brightInertia.current);
      brightInertia.current = null;
    }
  }, []);
  useEffect(() => () => cancelBrightInertia(), [cancelBrightInertia]);

  const onBrightDown = useCallback((e: React.PointerEvent) => {
    cancelBrightInertia();
    brightDrag.current = { active: true, startY: e.clientY, startVal: brightnessRef.current };
    brightSamples.current = [{ y: e.clientY, t: performance.now() }];
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [cancelBrightInertia]);

  const onBrightMove = useCallback((e: React.PointerEvent) => {
    if (!brightDrag.current.active) return;
    const dy = e.clientY - brightDrag.current.startY;
    const next = Math.max(0, Math.min(1, brightDrag.current.startVal + dy / 420));
    brightnessRef.current = next;
    setBrightness(next);
    onBrightnessChange?.(next);
    const s = brightSamples.current;
    s.push({ y: e.clientY, t: performance.now() });
    if (s.length > 8) s.shift();
  }, [onBrightnessChange]);

  const onBrightUp = useCallback(() => {
    if (!brightDrag.current.active) return;
    brightDrag.current.active = false;
    const SNAP = 0.05;
    const runSnap = () => {
      const raw    = brightnessRef.current;
      const target = Math.max(0, Math.min(1, Math.round(raw / SNAP) * SNAP));
      const step = () => {
        const diff = target - brightnessRef.current;
        if (Math.abs(diff) < 0.002) {
          brightnessRef.current = target; setBrightness(target); onBrightnessChange?.(target);
          brightInertia.current = null; return;
        }
        const next = Math.max(0, Math.min(1, brightnessRef.current + diff * 0.18));
        brightnessRef.current = next; setBrightness(next); onBrightnessChange?.(next);
        brightInertia.current = requestAnimationFrame(step);
      };
      brightInertia.current = requestAnimationFrame(step);
    };
    const now    = performance.now();
    const recent = brightSamples.current.filter(s => now - s.t < 80);
    if (recent.length < 2) { runSnap(); return; }
    const dt = recent[recent.length - 1].t - recent[0].t;
    const dy = recent[recent.length - 1].y - recent[0].y;
    if (dt < 4 || Math.abs(dy) < 2) { runSnap(); return; }
    let vel = Math.max(-0.014, Math.min(0.014, (dy / dt) / 420));
    if (Math.abs(vel) < 0.0003) { runSnap(); return; }
    let last = performance.now();
    const tick = (t: number) => {
      const elapsed = Math.min(t - last, 64);
      last = t;
      vel *= Math.pow(0.93, elapsed / 16);
      if (Math.abs(vel) < 0.0003) { runSnap(); return; }
      const next = Math.max(0, Math.min(1, brightnessRef.current + vel * elapsed));
      brightnessRef.current = next; setBrightness(next); onBrightnessChange?.(next);
      brightInertia.current = requestAnimationFrame(tick);
    };
    brightInertia.current = requestAnimationFrame(tick);
  }, [onBrightnessChange]);

  const satSnapRAF = useRef<number | null>(null);
  const satDrag    = useRef({ active: false, startY: 0, startVal: initSaturation });

  const onSatDown = useCallback((e: React.PointerEvent) => {
    if (satSnapRAF.current !== null) { cancelAnimationFrame(satSnapRAF.current); satSnapRAF.current = null; }
    satDrag.current = { active: true, startY: e.clientY, startVal: saturationRef.current };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onSatMove = useCallback((e: React.PointerEvent) => {
    if (!satDrag.current.active) return;
    const dy   = e.clientY - satDrag.current.startY;
    const next = Math.max(0, Math.min(1, satDrag.current.startVal + dy / 260));
    saturationRef.current = next; setSaturation(next);
  }, []);

  const onSatUp = useCallback(() => {
    if (!satDrag.current.active) return;
    satDrag.current.active = false;
    const SNAP   = 0.05;
    const target = Math.max(0, Math.min(1, Math.round(saturationRef.current / SNAP) * SNAP));
    const snap   = () => {
      const diff = target - saturationRef.current;
      if (Math.abs(diff) < 0.002) { saturationRef.current = target; setSaturation(target); satSnapRAF.current = null; return; }
      saturationRef.current += diff * 0.18; setSaturation(saturationRef.current);
      satSnapRAF.current = requestAnimationFrame(snap);
    };
    satSnapRAF.current = requestAnimationFrame(snap);
  }, []);

  const [hue, setHue] = useState(initHue);
  const hueRef    = useRef(initHue);
  const dialDrag  = useRef({ active: false, startX: 0, startHue: initHue });
  const dialSamples = useRef<Array<{ x: number; t: number }>>([]);
  const inertiaRAF  = useRef<number | null>(null);

  const cancelInertia = useCallback(() => {
    if (inertiaRAF.current !== null) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);
  useEffect(() => () => cancelInertia(), [cancelInertia]);

  const onDialDown = useCallback((e: React.PointerEvent) => {
    cancelInertia();
    dialDrag.current    = { active: true, startX: e.clientX, startHue: hueRef.current };
    dialSamples.current = [{ x: e.clientX, t: performance.now() }];
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [cancelInertia]);

  const onDialMove = useCallback((e: React.PointerEvent) => {
    if (!dialDrag.current.active) return;
    const dx   = e.clientX - dialDrag.current.startX;
    const next = ((dialDrag.current.startHue + dx * 0.55) % 360 + 360) % 360;
    hueRef.current = next; setHue(next); onHueChange?.(next);
    const s = dialSamples.current;
    s.push({ x: e.clientX, t: performance.now() });
    if (s.length > 8) s.shift();
  }, [onHueChange]);

  const onDialUp = useCallback(() => {
    if (!dialDrag.current.active) return;
    dialDrag.current.active = false;

    const TICK_HUE = 2;
    const runSnap = () => {
      const raw    = hueRef.current;
      const target = ((Math.round(raw / TICK_HUE) * TICK_HUE) % 360 + 360) % 360;
      const snapTick = () => {
        let diff = ((target - hueRef.current + 180 + 360) % 360) - 180;
        if (Math.abs(diff) < 0.04) {
          hueRef.current = target; setHue(target); onHueChange?.(target);
          inertiaRAF.current = null; return;
        }
        const next = ((hueRef.current + diff * 0.15 + 360) % 360);
        hueRef.current = next; setHue(next); onHueChange?.(next);
        inertiaRAF.current = requestAnimationFrame(snapTick);
      };
      inertiaRAF.current = requestAnimationFrame(snapTick);
    };

    const now    = performance.now();
    const recent = dialSamples.current.filter(s => now - s.t < 80);
    if (recent.length < 2) { runSnap(); return; }
    const dt = recent[recent.length - 1].t - recent[0].t;
    const dx = recent[recent.length - 1].x - recent[0].x;
    if (dt < 4 || Math.abs(dx) < 2) { runSnap(); return; }

    let vel = Math.max(-1.8, Math.min(1.8, (dx / dt) * 0.55));
    if (Math.abs(vel) < 0.025) { runSnap(); return; }

    let last = performance.now();
    const tick = (t: number) => {
      const elapsed = Math.min(t - last, 64);
      last = t;
      vel *= Math.pow(0.92, elapsed / 16);
      if (Math.abs(vel) < 0.008) { runSnap(); return; }
      const next = ((hueRef.current + vel * elapsed) % 360 + 360) % 360;
      hueRef.current = next; setHue(next); onHueChange?.(next);
      inertiaRAF.current = requestAnimationFrame(tick);
    };
    inertiaRAF.current = requestAnimationFrame(tick);
  }, [onHueChange]);

  const activePalette = hueToPalette(hue, saturation);
  const layers = buildDetailLayers(activePalette);

  const [cursorOff, setCursorOff] = useState({ x: 0, y: 0 });
  const [cursorActive, setCursorActive] = useState(false);
  const handleBlobCursorMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'open') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xFrac = Math.max(-1, Math.min(1, (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
    const yFrac = Math.max(-1, Math.min(1, (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
    setCursorActive(true);
    setCursorOff({ x: xFrac * 44, y: yFrac * 44 });
  }, [phase]);


  // Blob starts at its position on the main screen, expands to fill detail screen
  const [fromX, fromY] = BLOB_CORE_CENTERS[light.blobGroup];
  const dx = fromX - DETAIL_BLOB_CENTER[0];
  const dy = fromY - DETAIL_BLOB_CENTER[1];
  const isOpen = phase === 'open';
  const EASE   = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const SMOOTH = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  // Blob fly-in only when opening from main screen (not from card)
  const blobTransform = fromCardRect
    ? (isOpen ? 'none' : 'scale(0.94)')
    : (phase === 'open' ? 'none' : `translate(${dx}px, ${dy}px) scale(0.38)`);
  const blobTransition = fromCardRect
    ? (phase === 'open' ? `transform 0.44s ${SMOOTH}` : phase === 'exiting' ? `transform 0.22s ${EASE}` : 'none')
    : (phase === 'open' ? `transform 0.78s ${SMOOTH}` : phase === 'exiting' ? `transform 0.55s ${EASE}` : 'none');

  // Container: simple opacity fade — no position/scale transform so AppBar + grabber stay fixed
  const containerOpacity   = isOpen ? 1 : 0;
  const containerTransition = phase === 'open'
    ? `opacity 0.28s ${SMOOTH}`
    : phase === 'exiting'
      ? `opacity 0.20s ${EASE}`
      : 'none';

  // Brightness-driven blob visuals
  // Default entry = 0.72: full color, scale=1.0. Below → gray glow. Above → bigger.
  const DEFAULT_B = 0.72;
  const tLow  = Math.max(0, Math.min(1, brightness / DEFAULT_B));
  const tHigh = Math.max(0, Math.min(1, (brightness - DEFAULT_B) / (1 - DEFAULT_B)));
  const satMul = lerp(0, 2, saturation);
  const blobFilter = `saturate(${satMul.toFixed(2)}) contrast(${lerp(0.65, 1.12, tLow).toFixed(2)}) brightness(${lerp(0.20, 1.0, tLow).toFixed(2)})`;
  const blobScale  = brightness <= DEFAULT_B ? lerp(0.50, 1.0, tLow) : lerp(1.0, 1.20, tHigh);


  const glassCircle: React.CSSProperties = {
    width: 44, height: 44, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background: 'transparent',
    border: 'none', outline: 'none',
    boxShadow: 'none',
  };

  const initValRef = useRef({ brightness: initBrightness, hue: initHue });
  const isDirty = brightness !== initValRef.current.brightness || hue !== initValRef.current.hue;

  // Button press glow — rise ~100ms then decay ~700ms
  const btnFlashRef  = useRef({ x: 0, check: 0, power: 0 });
  const btnPhaseRef  = useRef<Record<'x'|'check'|'power','idle'|'rise'|'fall'>>({ x: 'idle', check: 'idle', power: 'idle' });
  const [btnFlash, setBtnFlash] = useState({ x: 0, check: 0, power: 0 });
  const btnFlashRAF  = useRef<number | null>(null);
  const triggerFlash = useCallback((btn: 'x' | 'check' | 'power') => {
    btnPhaseRef.current[btn] = 'rise';
    if (btnFlashRAF.current !== null) return;
    const tick = () => {
      let active = false;
      for (const k of ['x', 'check', 'power'] as const) {
        const phase = btnPhaseRef.current[k];
        if (phase === 'rise') {
          btnFlashRef.current[k] = Math.min(1, btnFlashRef.current[k] + 0.18);
          if (btnFlashRef.current[k] >= 1) btnPhaseRef.current[k] = 'fall';
          active = true;
        } else if (phase === 'fall') {
          btnFlashRef.current[k] *= 0.88;
          if (btnFlashRef.current[k] < 0.005) {
            btnFlashRef.current[k] = 0;
            btnPhaseRef.current[k] = 'idle';
          } else {
            active = true;
          }
        }
      }
      setBtnFlash({ ...btnFlashRef.current });
      if (active) btnFlashRAF.current = requestAnimationFrame(tick);
      else btnFlashRAF.current = null;
    };
    btnFlashRAF.current = requestAnimationFrame(tick);
  }, []);
  useEffect(() => () => { if (btnFlashRAF.current !== null) cancelAnimationFrame(btnFlashRAF.current); }, []);

  const handleSaveAndClose = () => {
    onSave({ brightness: Math.round(brightness * 100), customHue: hue, customSaturation: Math.round(saturation * 100) });
    handleClose();
  };

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: fromCardRect ? 45 : 30, overflow: 'hidden',
        background: 'linear-gradient(to bottom, rgb(23,22,28) 0%, rgb(31,12,15) 100%)',
        opacity: containerOpacity,
        transition: containerTransition,
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onMouseMove={handleBlobCursorMove}
      onMouseLeave={() => { setCursorActive(false); setCursorOff({ x: 0, y: 0 }); }}
    >
      <style>{`
        @keyframes blob-drift-sm { 0%,100%{transform:translate(0,0)} 33%{transform:translate(15px,-12px)} 66%{transform:translate(-12px,15px)} }
        @keyframes blob-drift-md { 0%,100%{transform:translate(0,0)} 28%{transform:translate(-33px,27px)} 70%{transform:translate(27px,-30px)} }
        @keyframes blob-drift-center { 0%,100%{transform:translate(0,0)} 42%{transform:translate(4px,-3px)} 78%{transform:translate(-3px,4px)} }
        @keyframes blob-breathe {
          0%,100% { transform:scale(0.96); opacity:0.93 }
          50%     { transform:scale(1.11); opacity:0.80 }
        }
        @keyframes blob-morph-a {
          0%,100% { border-radius:50% 50% 50% 50%/50% 50% 50% 50% }
          20%  { border-radius:70% 30% 62% 38%/42% 64% 36% 58% }
          45%  { border-radius:34% 66% 30% 70%/64% 36% 68% 32% }
          70%  { border-radius:64% 36% 42% 58%/30% 70% 34% 66% }
        }
        @keyframes blob-morph-b {
          0%,100% { border-radius:50% 50% 50% 50%/50% 50% 50% 50% }
          25%  { border-radius:30% 70% 66% 34%/62% 38% 60% 40% }
          55%  { border-radius:66% 34% 32% 68%/34% 66% 38% 62% }
          80%  { border-radius:38% 62% 70% 30%/68% 32% 64% 36% }
        }
      `}</style>
      {/* Blob — outer: enter/exit animation | inner: brightness + scale */}
      {!hideBlob && <div style={{
        position: 'absolute', inset: 0,
        transform: `translate(${cursorOff.x}px, ${cursorOff.y}px)`,
        transition: isOpen ? (cursorActive ? 'transform 1.8s cubic-bezier(0.33, 1, 0.68, 1)' : 'transform 2.6s cubic-bezier(0.65, 0, 0.35, 1)') : 'none',
        pointerEvents: 'none',
      }}>
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
          <ShaderDetailBlob hue={hue} saturation={saturation} />
          <ShaderDetailCA hue={hue} saturation={saturation} />
          {layers.map((l, i) => {
            const isCenter = i >= 7;
            const driftName = isCenter ? 'blob-drift-center' : i <= 3 ? 'blob-drift-sm' : 'blob-drift-md';
            const dur        = [11.1, 13.8, 12.6, 15.9, 12.0, 14.1, 12.9, 10.2, 14.4, 16.5];
            const driftDelay = [0, -4.2, -7.7, -2.1, -5.8, -1.1, -9.3, -0.3, -0.7, -1.1];
            // breathing: 4.8s ≈ calm breath, all layers nearly in phase
            const breatheDelay = [0, -0.3, -0.6, -0.2, -0.5, -0.8, -0.1, -0.4, -0.7, -0.9];
            const morphName  = i % 2 === 0 ? 'blob-morph-a' : 'blob-morph-b';
            return (
              <div key={i} style={{
                position: 'absolute',
                left: l.x, top: l.y, width: l.w, height: l.h,
                pointerEvents: 'none',
                animation: i === 0 ? 'none' : `blob-breathe 4.8s ease-in-out ${breatheDelay[i]}s infinite`,
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  borderRadius: '50%',
                  filter: `blur(${l.blur}px)`,
                  mixBlendMode: (l.blend ?? 'normal') as React.CSSProperties['mixBlendMode'],
                  opacity: l.op ?? 1,
                  background: l.bg,
                  pointerEvents: 'none',
                  animation: i === 0 ? 'none' : `${driftName} ${dur[i]}s ease-in-out ${driftDelay[i]}s infinite, ${morphName} ${(dur[i]*1.5).toFixed(1)}s ease-in-out ${driftDelay[i]-3}s infinite`,
                }} />
              </div>
            );
          })}
        </div>
        {/* White core — outer soft halo */}
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - 14, top: DETAIL_BLOB_CENTER[1] - 14,
          width: 29, height: 29, borderRadius: '50%',
          filter: 'blur(13px)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.88) 0%, rgba(255,252,242,0.30) 50%, transparent 75%)',
          opacity: lerp(0.64, 0, tLow),
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
        {/* White core — inner crisp point */}
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - 6, top: DETAIL_BLOB_CENTER[1] - 6,
          width: 12, height: 12, borderRadius: '50%',
          filter: 'blur(5px)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.96) 0%, rgba(255,252,245,0.50) 50%, transparent 80%)',
          opacity: lerp(0.72, 0, tLow),
          transition: 'opacity 0.12s ease',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }} />
      </div>
      </div>}

      {!hideBlob && <ShaderDetailGrain />}

      {/* Shader ambient — above blob, below controls */}
      {false && <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', mixBlendMode: 'screen' }}>
        <ShaderDetailBg hue={hue} />
      </div>}

      {/* Bottom vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, transparent 40%, rgb(20,13,17) 80%)',
      }} />

      {/* Status bar */}
      <StatusBar />

      {/* Nav bar — large title left + power button right */}
      <div style={{
        position: 'absolute', top: 52, left: 0, right: 0, height: 72, zIndex: 200,
        display: 'flex', alignItems: 'center',
        paddingLeft: 24, paddingRight: 24,
        pointerEvents: isOpen ? 'auto' : 'none',
        opacity: isOpen ? 1 : 0,
        transition: `opacity 0.40s ${EASE} 0.16s`,
      }}>
        <div style={{ flex: 1, pointerEvents: 'none' }}>
          <div style={{
            fontSize: 28, fontWeight: 700, color: 'rgba(255,239,241,1.00)',
            letterSpacing: '-0.5px', lineHeight: 1.1,
          }}>
            Lamp
          </div>
        </div>

        <button
          onClick={() => { setIsOn(v => !v); onToggle?.(); }}
          onPointerDown={() => triggerFlash('power')}
          style={{
            ...glassCircle,
            background: isOn ? `hsla(${hue},50%,75%,0.16)` : `hsla(${hue},40%,70%,0.08)`,
            transition: 'background 0.3s ease',
            border: 'none', outline: 'none',
            filter: btnFlash.power > 0.005 ? `brightness(${(1 + btnFlash.power * 1.6).toFixed(2)}) saturate(${(1 + btnFlash.power * 2.5).toFixed(2)})` : 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
            <path d="M4.2 2.0 A5.2 5.2 0 1 0 8.8 2.0"
              stroke={isOn ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)'}
              strokeWidth="1.5" strokeLinecap="round" fill="none"
              style={{ transition: 'stroke 0.3s ease' }}
            />
            <line x1="6.5" y1="0.5" x2="6.5" y2="5.8"
              stroke={isOn ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)'}
              strokeWidth="1.5" strokeLinecap="round"
              style={{ transition: 'stroke 0.3s ease' }}
            />
          </svg>
        </button>
      </div>

      {/* Bottom action bar — X and ✓ */}
      <div style={{
        position: 'absolute', bottom: 44, left: 0, right: 0, height: 44, zIndex: 34,
        pointerEvents: isOpen ? 'auto' : 'none',
        opacity: isOpen ? 1 : 0,
        transition: `opacity 0.40s ${EASE} 0.20s`,
      }}>
        {/* Close — X */}
        <button onClick={handleClose} onPointerDown={() => triggerFlash('x')} style={{
          position: 'absolute', left: 36, top: 0,
          width: 48, height: 48, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `hsla(${hue},45%,72%,0.12)`, border: 'none', outline: 'none', cursor: 'pointer',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          filter: btnFlash.x > 0.005 ? `brightness(${(1 + btnFlash.x * 1.6).toFixed(2)}) saturate(${(1 + btnFlash.x * 2.5).toFixed(2)})` : 'none',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="rgba(255,255,255,0.82)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Save — checkmark */}
        <button onClick={handleSaveAndClose} onPointerDown={() => triggerFlash('check')} style={{
          position: 'absolute', right: 36, top: 0,
          width: 48, height: 48, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `hsla(${hue},45%,72%,0.12)`, border: 'none', outline: 'none', cursor: 'pointer',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          filter: btnFlash.check > 0.005 ? `brightness(${(1 + btnFlash.check * 1.6).toFixed(2)}) saturate(${(1 + btnFlash.check * 2.5).toFixed(2)})` : 'none',
        }}>
          <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
            <path d="M1.5 6L5.5 10L13.5 1.5" stroke="rgba(255,255,255,0.88)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Swipe zone left — brightness */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 230,
          zIndex: 32, touchAction: 'none',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onPointerDown={onBrightDown}
        onPointerMove={onBrightMove}
        onPointerUp={onBrightUp}
        onPointerCancel={onBrightUp}
      />

      {/* Saturation zone — inner bowl of the dial arc */}
      <div
        style={{
          position: 'absolute',
          bottom: 50, left: 90, right: 90,
          height: 140,
          zIndex: 34, touchAction: 'none',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onPointerDown={onSatDown}
        onPointerMove={onSatMove}
        onPointerUp={onSatUp}
        onPointerCancel={onSatUp}
      />




      {/* Hue rotary dial */}
      {(() => {
        const DR = 230, DCX = 195, DSVGH = 100, DCY = 230;
        const DSPAN = 74, ARC_PER_HUE = 1.3, TICK_HUE = 2;
        const TICK_LEN = Math.max(2.5, 24 * saturation); // scales with saturation: short → full tick
        const tickFrac = Math.max(0, (TICK_LEN - 2.5) / 21.5); // 0 at min, 1 at max

        const visHalfSpan = DSPAN / ARC_PER_HUE;
        const cI = Math.round(hue / TICK_HUE);
        const nExt = Math.ceil(visHalfSpan / TICK_HUE) + 2;

        const tCenter: React.ReactElement[] = [];
        const tMid:    React.ReactElement[] = [];
        const tFar:    React.ReactElement[] = [];
        const tEdge:   React.ReactElement[] = [];
        const tOuter:  React.ReactElement[] = [];
        const tCAr:     React.ReactElement[] = [];
        const tCAb:     React.ReactElement[] = [];
        const tCAr2:    React.ReactElement[] = []; // blurred outer CA
        const tCAb2:    React.ReactElement[] = [];

        for (let i = cI - nExt; i <= cI + nExt; i++) {
          const tH  = i * TICK_HUE;
          const arcA = (tH - hue) * ARC_PER_HUE;
          if (Math.abs(arcA) > DSPAN) continue;
          const rad = arcA * Math.PI / 180;
          const x   = DCX + DR * Math.sin(rad);
          const y   = DCY - DR * Math.cos(rad);
          const nx  = (DCX - x) / DR, ny = (DCY - y) / DR;
          const ef       = Math.abs(arcA) / DSPAN;
          const op       = Math.max(0.06, 1 - ef * 0.88);
          // Full spectrum compressed into visible arc; centre 20% = selected hue
          const normArc   = arcA / DSPAN; // -1 … +1
          const specHue   = ((hue - normArc * 120) % 360 + 360) % 360;
          // t=0 at center → source color; t=1 at edge → spectrum color; blends across 0.10–0.32
          const t         = Math.max(0, Math.min(1, (Math.abs(normArc) - 0.10) / 0.22));
          const hueDelta  = (((specHue - hue) % 360) + 540) % 360 - 180; // shortest arc
          const blendHue  = ((hue + hueDelta * t) + 360) % 360;
          const blendSat  = Math.round(((90 + 10 * saturation) - 10 * t) * tickFrac);
          const blendLit  = Math.round(((78 - 14 * saturation) + 6 * t) * saturation + 95 * (1 - saturation));
          const tickOp    = op * (0.55 + 0.45 * saturation);
          const tickColor = `hsl(${Math.round(blendHue)},${blendSat}%,${blendLit}%)`;

          const mk = (key: string, dx = 0, color = tickColor, o = tickOp) => (
            <line key={key}
              x1={x + dx} y1={y} x2={x + nx * TICK_LEN + dx} y2={y + ny * TICK_LEN}
              stroke={color} strokeWidth={1.1} strokeLinecap="round" opacity={o} />
          );

          if      (ef < 0.48)  tCenter.push(mk(`c${i}`));
          else if (ef < 0.65)  tMid.push(mk(`m${i}`));
          else if (ef < 0.80)  tFar.push(mk(`f${i}`));
          else if (ef < 0.92)  tEdge.push(mk(`e${i}`));
          else                 tOuter.push(mk(`o${i}`));

          // Chromatic aberration at edges
          if (ef > 0.45) {
            const caStr = Math.min(1, (ef - 0.45) / 0.55);
            const caOff = caStr * 1.0 * (arcA > 0 ? 1 : -1);
            const caOp  = caStr * 0.55 * op;
            tCAr.push(mk(`cr${i}`,  caOff, 'rgba(255,80,80,1)',   caOp));
            tCAb.push(mk(`cb${i}`, -caOff, 'rgba(70,130,255,1)',  caOp));
            // Soft blurred CA for outermost zone
            if (ef > 0.78) {
              const ca2Str = Math.min(1, (ef - 0.78) / 0.22);
              const ca2Off = ca2Str * 1.0 * (arcA > 0 ? 1 : -1);
              const ca2Op  = ca2Str * 0.38 * op;
              tCAr2.push(mk(`cr2${i}`,  ca2Off, 'rgba(255,60,60,1)',  ca2Op));
              tCAb2.push(mk(`cb2${i}`, -ca2Off, 'rgba(50,110,255,1)', ca2Op));
            }
          }

        }

        const indicatorColor = hslToRgb(hue, 100, 75);
        return (<>
          {/* Arc-shaped hit zone for hue rotation */}
          <div style={{
            position: 'absolute', bottom: 8, left: 0, right: 0, height: 226, zIndex: 33,
            touchAction: 'none', cursor: 'ew-resize',
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
            onPointerDown={onDialDown}
            onPointerMove={onDialMove}
            onPointerUp={onDialUp}
            onPointerCancel={onDialUp}
          />
          <div style={{
            position: 'absolute', bottom: 100, left: 0, right: 0, height: DSVGH, zIndex: 33,
            pointerEvents: 'none',
            opacity: isOpen ? 1 : 0,
            transition: `opacity 0.40s ${EASE} 0.30s`,
          }}
          >
            <svg width="100%" height={DSVGH} viewBox={`0 0 390 ${DSVGH}`}
              style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <defs>
                <filter id="hd-blur-1" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.0"/>
                </filter>
                <filter id="hd-blur-2" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="1.8"/>
                </filter>
                <filter id="hd-blur-3" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="6.0"/>
                </filter>
                <filter id="hd-blur-4" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="11"/>
                </filter>
                <filter id="hd-ca-blur" x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="2.5"/>
                </filter>
              </defs>

              <g>{tCenter}</g>
              <g filter="url(#hd-blur-1)">{tMid}</g>
              <g filter="url(#hd-blur-2)">{tFar}</g>
              <g filter="url(#hd-blur-3)">{tEdge}</g>
              <g filter="url(#hd-blur-4)">{tOuter}</g>

              {/* Chromatic aberration — sharp */}
              <g style={{ mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'] }}>
                {tCAr}{tCAb}
              </g>
              {/* Chromatic aberration — soft blurred outer fringe */}
              <g style={{ mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'] }} filter="url(#hd-ca-blur)">
                {tCAr2}{tCAb2}
              </g>

              {/* Fixed center indicator */}
              <line x1={DCX} y1={-2} x2={DCX} y2={Math.round(10 + 18 * saturation)}
                stroke={indicatorColor} strokeWidth="2.4" strokeLinecap="round" opacity={0.95} />
            </svg>
          </div>
        </>);
      })()}

      {/* Grabber — draggable: pull down 80px to dismiss */}
      <div
        onPointerDown={onGrabberDown}
        onPointerMove={onGrabberMove}
        onPointerUp={onGrabberUp}
        onPointerCancel={onGrabberUp}
        style={{
          position: 'absolute',
          bottom: Math.max(-10, 2 - grabberDrag * 0.4),
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        <div style={{
          width: Math.max(16, 36 - grabberDrag * 0.28),
          height: 5,
          borderRadius: 3,
          background: `rgba(204,204,204,${Math.max(0.15, 0.40 - grabberDrag * 0.003)})`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

// ── GlslBlobCanvas — WebGL wave-noise blob with user-triggered color transitions

const GLSL_VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const GLSL_FRAG = `
  precision mediump float;
  uniform vec2  iResolution;
  uniform float iTime;
  uniform float uHueCur;
  uniform float uHuePrev;
  uniform float uT;
  uniform float uC2AsBg;
  uniform float uDarkFade;
  uniform float uEffTime;
  uniform float uFixedHue;
  uniform float uStrongBreathe;
  uniform float uNoBreath;

  mat2 Rot(float a) { float s=sin(a),c=cos(a); return mat2(c,-s,s,c); }
  vec2 hash(vec2 p) {
    p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));
    return fract(sin(p)*43758.5453);
  }
  float noise(vec2 p) {
    vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return 0.5+0.5*mix(
      mix(dot(-1.0+2.0*hash(i+vec2(0,0)),f-vec2(0,0)),dot(-1.0+2.0*hash(i+vec2(1,0)),f-vec2(1,0)),u.x),
      mix(dot(-1.0+2.0*hash(i+vec2(0,1)),f-vec2(0,1)),dot(-1.0+2.0*hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
  }
  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb=clamp(abs(mod(h/60.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    return l+s*(rgb-0.5)*(1.0-abs(2.0*l-1.0));
  }
  void getColors(float h, float hv, out vec3 c1, out vec3 c2, out vec3 c3, out vec3 c4) {
    c1 = hsl2rgb(h + hv,                        0.90, 0.64);
    c2 = mix(hsl2rgb(h + hv, 0.85, 0.48), vec3(0.078, 0.051, 0.067), uC2AsBg * uDarkFade);
    c3 = hsl2rgb(mod(h + hv - 12.0, 360.0),     0.92, 0.68);
    c4 = hsl2rgb(mod(h + hv - 20.0, 360.0),     0.88, 0.50);
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 tuv = uv - 0.5;
    vec2 tuvOrig = tuv;
    float breathe = 0.5 + 0.5 * sin(iTime * 1.309);
    float breatheScale = 1.0 - breathe * 0.055;
    float mask = 1.0 - smoothstep(0.14, 0.50, length(tuv) * breatheScale);
    if (mask <= 0.0) { gl_FragColor = vec4(0.0); return; }

    float degree = noise(vec2(uEffTime * 0.05, tuv.x * tuv.y));
    float aspect = iResolution.x / iResolution.y;
    tuv.y /= aspect;
    tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
    tuv.y *= aspect;

    float speed = uEffTime * 2.0;
    tuv.x += sin(tuv.y * 5.0 + speed) / 18.0;
    tuv.y += sin(tuv.x * 7.5 + speed) / 9.0;

    float hueVar = (sin(iTime * 0.23) * 2.0 + sin(iTime * 0.131) * 1.25 + sin(iTime * 0.053) * 0.5) * (1.0 - uFixedHue);
    vec3 a1,a2,a3,a4, b1,b2,b3,b4;
    getColors(uHueCur,  hueVar, a1,a2,a3,a4);
    getColors(uHuePrev, hueVar, b1,b2,b3,b4);
    float ease = uT*uT*(3.0-2.0*uT);
    vec3 color1=mix(b1,a1,ease); vec3 color2=mix(b2,a2,ease);
    vec3 color3=mix(b3,a3,ease); vec3 color4=mix(b4,a4,ease);

    float layerAngle = -5.0 + uEffTime * 34.0;
    float centerFade = smoothstep(0.08, 0.30, length(tuvOrig));
    float mixX = smoothstep(-0.3, 0.2, (tuvOrig * Rot(radians(layerAngle))).x) * centerFade;
    vec3 layer1 = mix(color3, color2, mixX);
    vec3 layer2 = mix(color4, color1, mixX);
    vec3 color  = mix(layer1,layer2,smoothstep(0.5,-0.3,tuv.y));

    float grain = length(hash(gl_FragCoord.xy+fract(iTime)*100.0))*0.07;
    color = max(vec3(0.0), color-grain);
    float breatheAlpha = mix(mix(0.91 + breathe * 0.09, 0.80 + breathe * 0.20, uStrongBreathe), 1.0, uNoBreath);
    color *= mask * breatheAlpha;

    gl_FragColor = vec4(color, mask * breatheAlpha);
  }
`;

const GLSL_CANVAS_SIZE = 880;

const GlslBlobCanvas = dynamic(
  () => Promise.resolve().then(() => {
    function GlslBlobCanvasImpl({ hue, size = GLSL_CANVAS_SIZE, offsetY = 0, useBgC2 = false, blur = 0, brightness = 1, saturate = 1, opacity = 1, fixedHue = false, strongBreathe = false, noBreath = false }: { hue: number; size?: number; offsetY?: number; useBgC2?: boolean; blur?: number; brightness?: number; saturate?: number; opacity?: number; fixedHue?: boolean; strongBreathe?: boolean; noBreath?: boolean }) {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const stateRef  = useRef({
        raf: 0,
        startTime: performance.now(),
        hueCur: hue, huePrev: hue, transT: 1.0, transStart: 0,
        locs: {} as Record<string, WebGLUniformLocation | null>,
      });

      useEffect(() => {
        const canvas = canvasRef.current!;
        const gl = canvas.getContext('webgl');
        if (!gl) return;
        const s = stateRef.current;

        const compile = (type: number, src: string) => {
          const sh = gl.createShader(type)!;
          gl.shaderSource(sh, src); gl.compileShader(sh); return sh;
        };
        const prog = gl.createProgram()!;
        gl.attachShader(prog, compile(gl.VERTEX_SHADER,   GLSL_VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, GLSL_FRAG));
        gl.linkProgram(prog); gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER,
          new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.uniform1f(gl.getUniformLocation(prog, 'uC2AsBg'),      useBgC2      ? 1.0 : 0.0);
        gl.uniform1f(gl.getUniformLocation(prog, 'uFixedHue'),     fixedHue     ? 1.0 : 0.0);
        gl.uniform1f(gl.getUniformLocation(prog, 'uStrongBreathe'), strongBreathe ? 1.0 : 0.0);
        gl.uniform1f(gl.getUniformLocation(prog, 'uNoBreath'),    noBreath   ? 1.0 : 0.0);

        s.locs = {
          iResolution: gl.getUniformLocation(prog, 'iResolution'),
          iTime:       gl.getUniformLocation(prog, 'iTime'),
          uHueCur:     gl.getUniformLocation(prog, 'uHueCur'),
          uHuePrev:    gl.getUniformLocation(prog, 'uHuePrev'),
          uT:          gl.getUniformLocation(prog, 'uT'),
          uDarkFade:   gl.getUniformLocation(prog, 'uDarkFade'),
          uEffTime:    gl.getUniformLocation(prog, 'uEffTime'),
        };

        const loop = () => {
          const now = performance.now();
          if (s.transT < 1.0) s.transT = Math.min(1.0, (now - s.transStart) / 900);
          const L = s.locs;
          gl.uniform2f(L.iResolution, canvas.width, canvas.height);
          const elapsed = (now - s.startTime) / 1000;
          gl.uniform1f(L.iTime,    elapsed);
          gl.uniform1f(L.uHueCur,  s.hueCur);
          gl.uniform1f(L.uHuePrev, s.huePrev);
          gl.uniform1f(L.uT,       s.transT);
          gl.uniform1f(L.uDarkFade, Math.min(1.0, elapsed / 2));
          // 0.5x speed for first 2s, linear ramp to 1x — integral gives effective time
          const effT = elapsed <= 2
            ? 0.5 * elapsed + 0.125 * elapsed * elapsed
            : elapsed - 0.5;
          gl.uniform1f(L.uEffTime, effT);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          s.raf = requestAnimationFrame(loop);
        };
        s.raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(s.raf);
      }, []);

      const prevHueRef = useRef(hue);
      useEffect(() => {
        if (hue === prevHueRef.current) return;
        const s = stateRef.current;
        const cur = mix01(s.huePrev, s.hueCur, Math.min(1, s.transT));
        s.huePrev   = cur;
        s.hueCur    = hue;
        s.transT    = 0;
        s.transStart = performance.now();
        prevHueRef.current = hue;
      }, [hue]);

      const half = size / 2;
      return (
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - half,
          top:  DETAIL_BLOB_CENTER[1] - half + offsetY,
          width: size, height: size,
          mixBlendMode: 'screen', pointerEvents: 'none',
          filter: [blur > 0 && `blur(${blur}px)`, brightness !== 1 && `brightness(${brightness})`, saturate !== 1 && `saturate(${saturate})`].filter(Boolean).join(' ') || undefined,
          opacity,
        }}>
          <canvas ref={canvasRef}
            width={size} height={size}
            style={{ display: 'block' }}
          />
        </div>
      );
    }
    return { default: GlslBlobCanvasImpl };
  }),
  { ssr: false }
);

function mix01(a: number, b: number, t: number) { return a + (b - a) * t; }

// ── Source detail screen 2 — screen 1 UI + GLSL wave blob overlay ─────────────

const ShaderChromaFlowEffect = dynamic(
  () => import('shaders/react').then(({
    Shader: SShader,
    ChromaFlow: SCF,
    FilmGrain: SFG,
    Glow: SGlow,
  }) => {
    const hslToHex = (h: number, s: number, l: number): string => {
      const hn = ((h % 360) + 360) % 360;
      const sl = s / 100, ll = l / 100;
      const a = sl * Math.min(ll, 1 - ll);
      const f = (n: number) => {
        const k = (n + hn / 30) % 12;
        return Math.round(255 * (ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };
    function Impl({ hue, brightness }: { hue: number; brightness: number }) {
      // All colors stay within ±20° of source hue to match blob palette (c1–c4 are h, h-12, h-20)
      // intensity and ripple strength scale with source brightness
      const cfIntensity  = Math.max(0.72, 0.90 * brightness);
      // Blue-purple zone (center 235°, ±75°): shrink hue spread → fixes pink center in
      // blue AND excess blue lower area in purple
      const bpDist    = Math.abs(((hue - 235 + 180 + 360) % 360) - 180);
      const bpZone    = Math.max(0, 1 - bpDist / 75);
      const spreadMul = 1 - bpZone * 0.62; // at peak: offsets reduced to ~38% of original

      // Blue zone (~220°): lightness boost + desaturate center to keep it icy, not pink
      const blueDist   = Math.abs(((hue - 220 + 180 + 360) % 360) - 180);
      const blueZone   = Math.max(0, 1 - blueDist / 55);
      const blueBoost  = Math.round(blueZone * 24);
      const baseSatAdj = Math.round(blueZone * 22);
      const baseLAdj   = Math.round(blueZone * 12);

      // Red zone (~5°): more vivid effect
      const redDist     = Math.abs(((hue - 5 + 180 + 360) % 360) - 180);
      const redZone     = Math.max(0, 1 - redDist / 50);
      const redBoost    = Math.round(redZone * 20);
      const redIntBoost = redZone * 0.25;

      // Averaged hue offsets (closer to source hue in blue/purple range)
      const oBase  = Math.round(-11 * spreadMul);
      const oUp    = Math.round(-16 * spreadMul);
      const oDown  = Math.round(-21 * spreadMul);
      const oLeft  = Math.round(-18 * spreadMul);
      const oRight = Math.round(-14 * spreadMul);

      return (
        <SShader style={{ position: 'absolute', inset: 0 }}>
          <SCF
            baseColor={hslToHex(hue + oBase,  90 - baseSatAdj, 50 + blueBoost + baseLAdj + redBoost)}
            upColor={hslToHex(hue + oUp,       88, 58 + blueBoost + redBoost)}
            downColor={hslToHex(hue + oDown,   85, 44 + blueBoost + redBoost)}
            leftColor={hslToHex(hue + oLeft,   88, 56 + blueBoost + redBoost)}
            rightColor={hslToHex(hue + oRight, 90, 48 + blueBoost + redBoost)}
            blendMode="linearDodge"
            intensity={cfIntensity + redIntBoost}
            radius={2}
            momentum={28}
          />
          <SGlow intensity={0.8} threshold={0.20} size={30} />
          <SFG strength={0.10} animated />
        </SShader>
      );
    }
    return { default: Impl };
  }),
  { ssr: false }
);

function SourceDetailScreen2({
  light, sceneIdx, onClose, onSave, fromCardRect, onToggle,
}: {
  light: LightSource;
  sceneIdx: number;
  onClose: () => void;
  onSave: (updates: SceneLightSettings) => void;
  fromCardRect?: DOMRect;
  onToggle?: () => void;
}) {
  const scenePalette   = (SCENE_CARD_PALETTES[sceneIdx] ?? SCENE_CARD_PALETTES[0])[light.blobGroup];
  const sceneData      = light.sceneSettings?.[sceneIdx];
  const initHue        = sceneData?.customHue ?? rgbToHue(scenePalette.fog);
  const initBrightness = (sceneData?.brightness ?? light.brightness) / 100;
  const [liveHue, setLiveHue] = useState(initHue);
  const [liveBrightness, setLiveBrightness] = useState(initBrightness);
  const DEFAULT_B  = 0.72;
  const tLow       = Math.max(0, Math.min(1, liveBrightness / DEFAULT_B));
  const tHigh      = Math.max(0, Math.min(1, (liveBrightness - DEFAULT_B) / (1 - DEFAULT_B)));
  const blobScale  = liveBrightness <= DEFAULT_B ? lerp(0.50, 1.0, tLow) : lerp(1.0, 1.20, tHigh);
  const blobBright = lerp(0.30, 1.0, tLow);
  const [pressing, setPressing] = useState(false);
  const [effectMounted, setEffectMounted] = useState(false);
  const [effectOpacity, setEffectOpacity] = useState(1);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dial zone starts at bottom: 228px → ~27% from bottom → yNorm ≈ 0.73
  const DIAL_ZONE_START = 0.73;

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if ((e.clientY - rect.top) / rect.height > DIAL_ZONE_START) return;
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setEffectMounted(true);
    setPressing(true);
  }, []);

  const handleRelease = useCallback(() => {
    setPressing(false);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => setEffectMounted(false), 1600);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height * 0.34;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const distFactor = Math.max(0.3, 1 - dist / (rect.width * 0.96));
    const yNorm = y / rect.height;
    // Fade to zero before the dial zone so no glow bleeds into it
    const FADE_START = 0.58;
    const yFactor = yNorm > DIAL_ZONE_START
      ? 0
      : yNorm > FADE_START
        ? Math.max(0, 1 - (yNorm - FADE_START) / (DIAL_ZONE_START - FADE_START))
        : 1;
    setEffectOpacity(distFactor * yFactor);
  }, []);

  return (
    <div
      style={{ position: 'absolute', inset: 0 }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      onMouseMove={handleMouseMove}
    >
      <SourceDetailScreen
        light={light}
        sceneIdx={sceneIdx}
        onClose={onClose}
        onSave={onSave}
        fromCardRect={fromCardRect}
        onBrightnessChange={setLiveBrightness}
        onHueChange={setLiveHue}
        onToggle={onToggle}
        hideBlob
      />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 31, pointerEvents: 'none',
        transform: `scale(${blobScale.toFixed(4)})`,
        transformOrigin: `${DETAIL_BLOB_CENTER[0]}px ${DETAIL_BLOB_CENTER[1]}px`,
        filter: blobBright < 0.999 ? `brightness(${blobBright.toFixed(3)})` : undefined,
      }}>
        <GlslBlobCanvas hue={(liveHue - 18 + 360) % 360} offsetY={80} useBgC2 brightness={0.65} saturate={1.7} opacity={0.65} />
        <GlslBlobCanvas hue={liveHue} size={528} blur={10} />
        <GlslBlobCanvas hue={(liveHue + 14) % 360} size={280} blur={5} brightness={0.8} fixedHue strongBreathe />
        <GlslBlobCanvas hue={(liveHue + 14) % 360} size={160} blur={18} brightness={0.8} fixedHue noBreath />
        {/* Bright core — screen blend to lighten the dark center spot */}
        <div style={{
          position: 'absolute',
          left: DETAIL_BLOB_CENTER[0] - 52, top: DETAIL_BLOB_CENTER[1] - 52,
          width: 104, height: 104, borderRadius: '50%',
          background: `radial-gradient(circle, hsl(${liveHue},50%,90%) 0%, hsl(${liveHue},60%,78%) 40%, transparent 80%)`,
          filter: 'blur(18px)',
          mixBlendMode: 'screen',
          opacity: 0.41,
          pointerEvents: 'none',
        }} />
      </div>
      {effectMounted && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 35, pointerEvents: 'none',
          filter: 'blur(12px)',
          opacity: pressing ? effectOpacity * blobBright : 0,
          transition: pressing ? 'none' : 'opacity 1.5s ease-out',
        }}>
          <ShaderChromaFlowEffect hue={(liveHue - 18 + 360) % 360} brightness={blobBright} />
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const DEFAULT_LIGHTS: LightSource[] = [
  { id: 1, name: 'Торшер',    brightness: 80,  on: true,  blobGroup: 2 }, // Group 1 (top)
  { id: 2, name: 'Источник с шумами', brightness: 60, on: true, blobGroup: 1 }, // Group 2 (bottom-right)
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
  const [showSchedule, setShowSchedule] = useState(false);
  const [showFromPhoto, setShowFromPhoto] = useState(false);
  const [stylePickerForceExit, setStylePickerForceExit] = useState(false);
  const [blinkActive, setBlinkActive] = useState(false);
  const [blinkVisible, setBlinkVisible] = useState(false);
  const [extraScenes, setExtraScenes] = useState<SceneDef[]>([]);
  const [blobsColorized, setBlobsColorized] = useState(false);
  const [lights, setLights] = useState<LightSource[]>(DEFAULT_LIGHTS);
  const [detailLight, setDetailLight] = useState<LightSource | null>(null);
  const [detailLight2, setDetailLight2] = useState<LightSource | null>(null);
  const detailFromCardRef = useRef<DOMRect | null>(null);
  const [flares, setFlares] = useState<FlareState[]>([]);
  const flareIdRef = useRef(0);
  const toggleLight = useCallback((id: number) => {
    setLights(prev => prev.map(l => l.id === id ? { ...l, on: !l.on } : l));
  }, []);
  const allScenes = [...SCENES, ...extraScenes];
  const allN = allScenes.length;
  const allNRef = useRef(allN);
  allNRef.current = allN;
  const posToIdxAll = (p: number) => ((p % allN) + allN) % allN;
  const activeScene = posToIdxAll(logPos);
  const safeSceneIdx = Math.min(activeScene, SCENES.length - 1);
  const safeSceneIdxRef = useRef(safeSceneIdx);
  safeSceneIdxRef.current = safeSceneIdx;

  const cursorLastRef = useRef(0);
  const cursorIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorActiveRef = useRef(false);
  const [cursorActive, setCursorActive] = useState(false);
  const [cursorData, setCursorData] = useState({
    a: '#ff8373', b: '#ffa042',
    caAngle: 0, caRed: -1, caGreen: 0, caBlue: 1,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cursorActiveRef.current) { cursorActiveRef.current = true; setCursorActive(true); }
    if (cursorIdleRef.current) clearTimeout(cursorIdleRef.current);
    cursorIdleRef.current = setTimeout(() => { cursorActiveRef.current = false; setCursorActive(false); }, 500);

    const now = Date.now();
    if (now - cursorLastRef.current < 80) return;
    cursorLastRef.current = now;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const weights = BLOB_CORE_CENTERS.map(([cx, cy]) => 1 / Math.max(Math.hypot(x - cx, y - cy) ** 2, 2500));
    const total = weights.reduce((s, w) => s + w, 0);
    const n = weights.map(w => w / total);
    const scene = SCENES[safeSceneIdxRef.current];
    const r = Math.round(n.reduce((s, w, i) => s + w * scene.blobs[i].rim[0], 0));
    const g = Math.round(n.reduce((s, w, i) => s + w * scene.blobs[i].rim[1], 0));
    const b = Math.round(n.reduce((s, w, i) => s + w * scene.blobs[i].rim[2], 0));
    const [hue, , lit] = rgbToHsl(r, g, b);
    const [caRed, caGreen, caBlue] = analogousOffsets(hue);
    setCursorData({
      a: hslToRgb(hue, 100, Math.min(65, Math.max(50, lit))),
      b: hslToRgb((hue - 22 + 360) % 360, 100, Math.min(68, Math.max(52, lit + 4))),
      caAngle: hue,
      caRed,
      caGreen,
      caBlue,
    });
  }, []);

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

  const handleStyleDone = useCallback(() => {
    setStylePickerForceExit(true);
    setBlobsColorized(true);
    setTimeout(() => {
      setExtraScenes([CUSTOM_SCENE]);
      // navigate to the new scene after state settles
      setTimeout(() => {
        const n = allNRef.current; // will be SCENES.length + 1 after setExtraScenes
        const newIdx = n - 1;
        const cur = logPosRef.current;
        const curIdx = ((cur % n) + n) % n;
        let delta = newIdx - curIdx;
        if (delta > n / 2) delta -= n;
        if (delta < -n / 2) delta += n;
        logPosRef.current = cur + delta;
        setLogPos(cur + delta);
      }, 60);
    }, 440);
  }, []);

  const handleScheduleConfirm = useCallback(() => {
    // Phase 1 (0–800ms): overlay fades in
    setBlinkActive(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setBlinkVisible(true)));
    // Phase 2 (800ms): close sheet behind darkness, start fade-out
    setTimeout(() => {
      setShowSchedule(false);
      setShowOverview(false);
      setBlinkVisible(false);
      // Phase 2 end (800+800ms): unmount overlay
      setTimeout(() => setBlinkActive(false), 800);
    }, 800);
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

  const groupBrightness = ([0, 1, 2] as const).map(group => {
    const onLights = lights.filter(l => l.on && l.blobGroup === group);
    if (onLights.length === 0) return 1.0;
    const avg = onLights.reduce((sum, l) => {
      const br = l.sceneSettings?.[activeScene]?.brightness ?? l.brightness;
      return sum + br;
    }, 0) / onLights.length;
    return avg / 100;
  }) as [number, number, number];

  // All custom colors per scene (one per blobGroup, brightest source wins) — for sphere highlights
  const sceneCustomData: { hue: number; saturation: number }[][] = Array.from({ length: allN }, (_, sceneIdx) => {
    const byGroup = new Map<number, { hue: number; saturation: number }>();
    [...lights]
      .sort((a, b) => b.brightness - a.brightness)
      .filter(l => l.on && l.sceneSettings?.[sceneIdx]?.customHue !== undefined)
      .forEach(l => {
        if (!byGroup.has(l.blobGroup)) {
          const d = l.sceneSettings![sceneIdx]!;
          byGroup.set(l.blobGroup, { hue: d.customHue, saturation: d.customSaturation ?? 72 });
        }
      });
    return Array.from(byGroup.values());
  });

  const handleBlobClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (showOverview || showStylePicker || detailLight !== null || detailLight2 !== null) return;
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
    if (!primary) return;
    setDetailLight2(primary);
  }, [showOverview, showStylePicker, detailLight, detailLight2, lights, openDetail]);

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
    const n          = allNRef.current;
    const currentIdx = ((current % n) + n) % n;
    let delta = i - currentIdx;
    if (delta >  n / 2) delta -= n;
    if (delta < -n / 2) delta += n;
    logPosRef.current = current + delta;
    setLogPos(current + delta);
  }, []);

  useEffect(() => {
    const [r, g, b] = (allScenes[activeScene] ?? SCENES[0]).panelColor;
    if (gradientRef.current)
      gradientRef.current.style.background =
        `linear-gradient(to bottom, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0.95) 72.7%)`;
  }, [activeScene, allScenes]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative overflow-hidden" style={{ width: W, height: H, background: "#17171C", borderRadius: 65 }} onPointerDown={handleFlare} onClick={handleBlobClick} onMouseMove={handleMouseMove}>
        <CSSBlobsV1 sceneIdx={safeSceneIdx} groupBrightness={groupBrightness as [number, number, number]} groupCustomHues={groupCustomHues} groupSaturations={groupSaturations} />
        <ShaderBlobV2 />
        {false && <div style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: '73%', zIndex: 2, pointerEvents: 'none',
          opacity: cursorActive ? 1 : 0,
          transition: cursorActive ? 'opacity 0.35s ease-out' : 'opacity 1.1s ease-in',
        }}>
          <ShaderOverlay sceneIdx={safeSceneIdx} cursorColorA={cursorData.a} cursorColorB={cursorData.b} caAngle={cursorData.caAngle} caRed={cursorData.caRed} caGreen={cursorData.caGreen} caBlue={cursorData.caBlue} />
        </div>}
        {/* Custom hue overlays — tint each blob group when a light has been configured */}
        {false && groupCustomHues.map((customHue, group) => customHue === null ? null : (
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
        {false && <BlobHeat sceneIdx={safeSceneIdx} />}
        {/* Sphere-style color overlays — fade in permanently after photo style is created */}
        {false && ([
          { group: 0, hue: 328, sat: 88 }, // pink  (left blob)
          { group: 1, hue: 38,  sat: 95 }, // yellow-orange (bottom-right)
          { group: 2, hue: 290, sat: 78 }, // purple (top)
        ] as { group: number; hue: number; sat: number }[]).map(({ group, hue, sat }) => (
          <div key={`sc-${group}`} style={{
            position: 'absolute',
            left: BLOB_CORE_CENTERS[group][0] - 200,
            top:  BLOB_CORE_CENTERS[group][1] - 200,
            width: 400, height: 400, borderRadius: '50%',
            background: `hsl(${hue}, ${sat}%, 52%)`,
            filter: 'blur(80px)',
            mixBlendMode: 'color',
            opacity: blobsColorized ? 0.88 : 0,
            transition: 'opacity 1.8s ease',
            pointerEvents: 'none',
            zIndex: 2,
          }} />
        ))}
        {/* Cursor:pointer hit zones over blob areas */}
        {BLOB_CORE_CENTERS.map(([cx, cy], i) => (
          <div key={`hit-${i}`} style={{
            position: 'absolute',
            left: cx - 110, top: cy - 110,
            width: 220, height: 220,
            borderRadius: '50%',
            cursor: 'pointer',
            pointerEvents: (showOverview || showStylePicker || detailLight !== null || showSchedule || showFromPhoto) ? 'none' : 'auto',
            zIndex: 3,
          }} />
        ))}
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
        <Controls onOverview={() => setShowOverview(true)} onSchedule={() => setShowSchedule(true)} />
        <BottomTray activeScene={activeScene} logPos={logPos} onSceneChange={changeScene} onNewStyle={() => setShowStylePicker(true)} sceneCustomData={sceneCustomData} allScenes={allScenes} />
        {showStylePicker && <StylePickerSheet onClose={() => { setShowStylePicker(false); setStylePickerForceExit(false); }} onFromPhoto={() => setShowFromPhoto(true)} forcedExit={stylePickerForceExit} />}
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
        {showOverview && <OverviewSheet lights={lights} onToggle={toggleLight} onClose={() => setShowOverview(false)} onDetail={(l, rect) => { detailFromCardRef.current = rect; openDetail(l); }} activeScene={activeScene} />}
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
            fromCardRect={detailFromCardRef.current ?? undefined}
            onClose={() => { setDetailLight(null); detailFromCardRef.current = null; }}
            onSave={(updates) => { saveLight(detailLight.id, activeScene, updates); setDetailLight(null); detailFromCardRef.current = null; }}
          />
        )}
        {detailLight2 && (
          <SourceDetailScreen2
            light={detailLight2}
            sceneIdx={activeScene}
            onClose={() => setDetailLight2(null)}
            onSave={(updates) => { saveLight(detailLight2.id, activeScene, updates); setDetailLight2(null); }}
            onToggle={() => toggleLight(detailLight2.id)}
          />
        )}
        {showFromPhoto && (
          <FromPhotoSheet
            onClose={() => { setShowFromPhoto(false); setShowStylePicker(false); setStylePickerForceExit(false); }}
            onBack={() => setShowFromPhoto(false)}
            onCloseAll={() => setStylePickerForceExit(true)}
            onDone={handleStyleDone}
          />
        )}
        {showFromPhoto && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: 'none' }}>
            <StatusBar />
          </div>
        )}
        {showFromPhoto && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(204,204,204,0.50)' }} />
          </div>
        )}
        {showSchedule && (
          <SceneScheduleSheet
            activeScene={activeScene}
            onClose={() => { setShowSchedule(false); setShowOverview(false); }}
            onConfirm={handleScheduleConfirm}
            onTurnOffAll={() => setLights(prev => prev.map(l => ({ ...l, on: false })))}
          />
        )}
        {blinkActive && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 200,
            background: '#000',
            opacity: blinkVisible ? 0.30 : 0,
            transition: 'opacity 0.8s ease-in-out',
            pointerEvents: 'none',
          }} />
        )}
        {showSchedule && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: 'none' }}>
            <StatusBar />
          </div>
        )}
        {showSchedule && (
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 36, height: 5, borderRadius: 3, background: 'rgba(204,204,204,0.50)' }} />
          </div>
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

// ── From Photo Sheet ──────────────────────────────────────────────────────────

function FromPhotoSheet({ onClose, onBack, onCloseAll, onDone }: { onClose: () => void; onBack: () => void; onCloseAll?: () => void; onDone?: () => void }) {
  const [entered,      setEntered]      = useState(false);
  const [exiting,      setExiting]      = useState(false);
  const [frameHovered, setFrameHovered] = useState(false);
  const [framePressed, setFramePressed] = useState(false);
  const [phase, setPhase] = useState<'empty' | 'photo' | 'processing' | 'sphere' | 'done'>('empty');
  const [photoReveal,  setPhotoReveal]  = useState(false);
  const [btnVisible,   setBtnVisible]   = useState(false);
  const [iconSwap,     setIconSwap]     = useState(false);
  const [frameDims,    setFrameDims]    = useState<{w:number;h:number}|null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Measure natural frame size once so we can animate from it
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (frameRef.current) {
        const r = frameRef.current.getBoundingClientRect();
        setFrameDims({ w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const exit = (cb: () => void) => { setExiting(true); setTimeout(cb, 420); };
  const isIn         = entered && !exiting;
  const ease         = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const isSphere     = phase === 'sphere' || phase === 'done';
  const isProcessing = phase === 'processing' || phase === 'sphere';
  const isDone       = phase === 'done';

  const handleFrameClick = () => {
    if (phase !== 'empty') return;
    setFramePressed(false);
    setPhase('photo');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setPhotoReveal(true);
      setTimeout(() => setBtnVisible(true), 320);
    }));
  };

  const handleStyleClick = () => {
    if (phase === 'done') {
      onDone?.();
      exit(onClose);
      return;
    }
    if (phase !== 'photo') return;
    setPhase('processing');
    setTimeout(() => {
      setPhase('sphere');
      setTimeout(() => {
        setPhase('done');
        setTimeout(() => setIconSwap(true), 180);
      }, 1000);
    }, 2500);
  };

  const SPHERE_SIZE = 228;
  const spring = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  const morphT  = `width 0.78s ${spring}, height 0.78s ${spring}, border-radius 0.72s ${spring}`;

  // Explicit pixel dims after measurement → used for morphing
  const frameW = isSphere ? SPHERE_SIZE : (frameDims?.w ?? undefined);
  const frameH = isSphere ? SPHERE_SIZE : (frameDims?.h ?? undefined);
  const useAR  = !frameDims && !isSphere; // fall back to aspectRatio before measurement

  const glassBase: React.CSSProperties = {
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.22)',
    cursor: 'pointer',
  };

  const MESH = [
    { left: '8%',  top: '12%', width: '65%', height: '50%', color: 'rgba(255,100,60,0.22)',  blur: 38, dur: '3.8s', delay: '0s'    },
    { left: '35%', top: '40%', width: '60%', height: '52%', color: 'rgba(140,60,255,0.18)',  blur: 42, dur: '5.2s', delay: '-1.7s' },
    { left: '5%',  top: '48%', width: '55%', height: '44%', color: 'rgba(60,140,255,0.16)',  blur: 36, dur: '4.5s', delay: '-2.3s' },
    { left: '30%', top: '8%',  width: '48%', height: '48%', color: 'rgba(255,160,60,0.14)',  blur: 40, dur: '6.1s', delay: '-3.1s' },
  ];

  // Warm shimmer — pink/orange tones matching the photo palette
  const SHIMMER = [
    { left: '-5%', top: '5%',  width: '68%', height: '58%', color: 'rgba(255,100,170,0.60)', blur: 36, dur: '2.0s', delay: '0s'    },
    { left: '38%', top: '25%', width: '65%', height: '62%', color: 'rgba(255,140,50,0.55)',  blur: 40, dur: '2.9s', delay: '-0.9s' },
    { left: '3%',  top: '42%', width: '58%', height: '54%', color: 'rgba(200,40,110,0.50)',  blur: 36, dur: '2.5s', delay: '-1.5s' },
    { left: '26%', top: '2%',  width: '55%', height: '52%', color: 'rgba(255,215,80,0.48)',  blur: 38, dur: '3.4s', delay: '-2.0s' },
    { left: '55%', top: '50%', width: '50%', height: '48%', color: 'rgba(160,40,230,0.44)',  blur: 34, dur: '3.1s', delay: '-1.1s' },
    { left: '-2%', top: '60%', width: '46%', height: '44%', color: 'rgba(255,80,130,0.40)',  blur: 32, dur: '4.0s', delay: '-2.7s' },
    { left: '42%', top: '-2%', width: '44%', height: '46%', color: 'rgba(255,190,60,0.36)',  blur: 38, dur: '2.7s', delay: '-0.4s' },
  ];

  // Yellow/pink sphere — red scene structure + Сияние diagonal curl
  const SPHERE_GRADIENT = [
    "radial-gradient(ellipse 42% 30% at 22% 20%, rgb(255,218,52) 0%, rgba(255,190,40,0.55) 45%, transparent 72%)",
    "radial-gradient(ellipse at 32% 48%, rgb(255,175,78) 0%, transparent 42%)",
    "radial-gradient(ellipse at 52% 52%, rgb(238,65,140) 0%, transparent 38%)",
    "radial-gradient(ellipse 68% 20% at 36% 42%, rgba(255,198,78,0.65) 0%, rgba(255,158,55,0.18) 62%, transparent 85%)",
    "radial-gradient(ellipse at 80% 18%, rgb(158,18,108) 0%, transparent 44%)",
    "radial-gradient(ellipse 28% 55% at 90% 52%, rgb(108,8,78) 0%, transparent 60%)",
    "radial-gradient(ellipse at 18% 78%, rgb(218,148,38) 0%, transparent 42%)",
    "radial-gradient(ellipse at 78% 80%, rgb(98,8,68) 0%, transparent 44%)",
    "rgb(68,6,42)",
  ].join(', ');

  const frameFilter = framePressed
    ? 'brightness(0.88) saturate(1.10)'
    : frameHovered
      ? 'brightness(1.05) saturate(1.10)'
      : 'brightness(1) saturate(1)';

  const btnLabel = isDone ? 'Готово' : isProcessing ? 'Создаем' : 'Сделать стиль';

  return (
    <>
      <style>{`
        @keyframes meshPulse {
          0%,100% { opacity: 0.15; }
          50%      { opacity: 1; }
        }
        @keyframes shimmerPulse {
          0%,100% { opacity: 0.20; }
          50%      { opacity: 1; }
        }
        @keyframes sparkColorPulse {
          0%   { fill: rgba(255,235,242,0.95); }
          33%  { fill: rgba(255,252,228,0.95); }
          66%  { fill: rgba(238,228,255,0.95); }
          100% { fill: rgba(255,235,242,0.95); }
        }
        @keyframes textSlideUp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes sphereShimmer {
          0%   { opacity: 0.18; transform: scale(1)    translate(0px,   0px);  }
          30%  { opacity: 0.62; transform: scale(1.14) translate(9px,  -7px);  }
          60%  { opacity: 0.28; transform: scale(0.94) translate(-7px,  9px);  }
          100% { opacity: 0.18; transform: scale(1)    translate(0px,   0px);  }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0, zIndex: 44,
        background: [
          'radial-gradient(ellipse 75% 55% at 18% 22%, rgba(255,160,130,0.07) 0%, transparent 60%)',
          'radial-gradient(ellipse 60% 50% at 82% 72%, rgba(160,120,220,0.07) 0%, transparent 60%)',
          'radial-gradient(ellipse 50% 40% at 50% 5%,  rgba(255,200,180,0.05) 0%, transparent 55%)',
          'linear-gradient(to bottom, rgb(18,13,24) 0%, rgb(12,9,18) 100%)',
        ].join(', '),
        opacity:    isIn ? 1 : 0,
        transform:  isIn ? 'translateY(0px)' : 'translateY(56px)',
        filter:     isIn ? 'blur(0px)' : 'blur(14px)',
        transition: `opacity 0.34s ${ease}, transform 0.34s ${ease}, filter 0.34s ${ease}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ height: 109, display: 'flex', alignItems: 'flex-end', paddingLeft: 16, paddingRight: 16, flexShrink: 0, justifyContent: 'space-between' }}>
          <button onClick={() => exit(onBack)} style={{ ...glassBase, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="17" viewBox="0 0 10 17" fill="none" style={{ marginLeft: -3 }}>
              <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="rgba(255,255,255,0.88)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.2px', marginBottom: 12 }}>Из фото</span>
          <button onClick={() => { onCloseAll?.(); exit(onClose); }} style={{ ...glassBase, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1.5 1.5L11.5 11.5M11.5 1.5L1.5 11.5" stroke="rgba(255,255,255,0.88)" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Center — single frame div morphs into sphere */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            ref={frameRef}
            style={{
              // Size: use measured px for morphing, fallback to aspectRatio before measurement
              width:       frameW ?? 'calc(100% - 48px)',
              height:      frameH,
              aspectRatio: useAR ? '3/4' : undefined,
              borderRadius: isSphere ? '50%' : 42,
              padding: isSphere ? 0 : '1.5px',
              background: isSphere
                ? 'none'
                : 'linear-gradient(135deg, rgba(255,170,130,0.26) 0%, rgba(190,110,255,0.18) 30%, rgba(110,180,255,0.22) 60%, rgba(255,170,130,0.26) 100%)',
              filter: phase === 'empty' ? frameFilter : 'brightness(1) saturate(1)',
              transition: isSphere
                ? morphT
                : framePressed ? 'filter 0.08s ease' : 'filter 0.25s ease',
              cursor: phase === 'empty' ? 'pointer' : 'default',
              pointerEvents: phase === 'empty' ? 'auto' : 'none',
              flexShrink: 0,
            }}
            onMouseEnter={() => { if (phase === 'empty') setFrameHovered(true); }}
            onMouseLeave={() => { setFrameHovered(false); setFramePressed(false); }}
            onMouseDown={() => { if (phase === 'empty') setFramePressed(true); }}
            onMouseUp={() => setFramePressed(false)}
            onClick={handleFrameClick}
          >
            {/* Inner glass */}
            <div style={{
              width: '100%', height: '100%',
              borderRadius: isSphere ? '50%' : 40.5,
              transition: isSphere ? `border-radius 0.72s ${spring}` : 'none',
              backdropFilter: 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: 'blur(28px) saturate(140%)',
              background: 'rgba(10,5,20,0.40)',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Ambient mesh */}
              {MESH.map((b, i) => (
                <div key={i} style={{
                  position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height,
                  borderRadius: '50%', background: b.color, filter: `blur(${b.blur}px)`,
                  animation: `meshPulse ${b.dur} ease-in-out infinite`, animationDelay: b.delay, pointerEvents: 'none',
                }} />
              ))}
              {/* Photo — fades in on tap, fades out as sphere gradient takes over */}
              {phase !== 'empty' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'url(/style-visualize.jpg)',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  opacity: (photoReveal && !isSphere) ? 1 : 0,
                  transition: isSphere ? 'opacity 0.70s ease' : 'opacity 0.65s ease',
                  zIndex: 2,
                }} />
              )}
              {/* Warm aurora sphere gradient — replaces photo via fade */}
              {phase !== 'empty' && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
                  background: SPHERE_GRADIENT,
                  filter: 'saturate(1.3)',
                  opacity: isSphere ? 1 : 0,
                  transition: isSphere ? 'opacity 0.72s ease 0.10s' : 'opacity 0.2s ease',
                }} />
              )}
              {/* Warm shimmer — fades in on processing, fades out on done */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 5,
                overflow: 'hidden', pointerEvents: 'none',
                opacity: (isProcessing && !isDone) ? 1 : 0,
                transition: 'opacity 0.8s ease',
              }}>
                {SHIMMER.map((b, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: b.left, top: b.top, width: b.width, height: b.height,
                    borderRadius: '50%', background: b.color, filter: `blur(${b.blur}px)`,
                    animation: `shimmerPulse ${b.dur} ease-in-out infinite`, animationDelay: b.delay,
                  }} />
                ))}
              </div>
              {/* Iridescent sphere shimmer — flowing color blobs, only when sphere */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
                opacity: isSphere ? 1 : 0,
                transition: 'opacity 0.6s ease 0.5s',
              }}>
                {([
                  { left: '8%',  top: '18%', w: '62%', h: '52%', color: 'rgba(255,210,80,0.42)',  blur: 30, dur: '3.4s', delay: '0s'    },
                  { left: '38%', top: '28%', w: '58%', h: '50%', color: 'rgba(255,70,170,0.36)',   blur: 32, dur: '4.2s', delay: '-1.5s' },
                  { left: '4%',  top: '44%', w: '52%', h: '46%', color: 'rgba(130,30,210,0.30)',   blur: 28, dur: '3.8s', delay: '-2.2s' },
                  { left: '32%', top: '8%',  w: '50%', h: '44%', color: 'rgba(255,150,55,0.28)',   blur: 30, dur: '5.1s', delay: '-0.9s' },
                ] as {left:string;top:string;w:string;h:string;color:string;blur:number;dur:string;delay:string}[]).map((b, i) => (
                  <div key={i} style={{
                    position: 'absolute', left: b.left, top: b.top, width: b.w, height: b.h,
                    borderRadius: '50%', background: b.color, filter: `blur(${b.blur}px)`,
                    animation: `sphereShimmer ${b.dur} ease-in-out infinite`, animationDelay: b.delay,
                  }} />
                ))}
              </div>
              {/* Frosted glass layers — fade in as sphere forms */}
              <div style={{
                position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none',
                opacity: isSphere ? 1 : 0,
                transition: isSphere ? 'opacity 0.55s ease 0.30s' : 'opacity 0.2s ease',
              }}>
                {/* Frosted coat — матовая поверхность рассеивает внутренний свет */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 94% 90% at 50% 48%, rgba(255,255,255,0.22) 0%, rgba(255,245,235,0.10) 55%, transparent 80%)' }} />
                {/* Inner glow bloom — свет, пробивающийся сквозь матовое стекло изнутри */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 62% 58% at 50% 50%, rgba(255,255,230,0.38) 0%, rgba(255,210,160,0.18) 45%, transparent 70%)' }} />
                {/* Primary specular — главный блик на поверхности стекла */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 22% 16% at 31% 17%, rgba(255,255,255,0.96) 0%, rgba(255,252,238,0.60) 32%, transparent 66%)' }} />
                {/* Micro glint — острая горячая точка внутри блика */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 5% 3.5% at 26% 12%, rgba(255,255,255,1) 0%, transparent 100%)' }} />
                {/* Secondary specular — меньший блик справа-сверху */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 10% 7% at 72% 20%, rgba(255,255,255,0.58) 0%, transparent 68%)' }} />
                {/* Fresnel rim — тонкий светлый ободок от полного внутреннего отражения */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 9% 58% at 97% 52%, rgba(255,225,200,0.40) 0%, transparent 72%)' }} />
                {/* Bottom warm rim — тёплый свет огибает нижний край */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 58% 14% at 50% 99%, rgba(255,195,120,0.28) 0%, transparent 68%)' }} />
                {/* Left thin catch light — отблеск слева */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 6% 32% at 2% 48%, rgba(255,185,215,0.24) 0%, transparent 72%)' }} />
                {/* Edge vignette — темнее к краям, создаёт объём */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 38%, rgba(10,2,25,0.75) 100%)' }} />
              </div>
              {/* Plus icon */}
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" style={{
                position: 'relative', zIndex: 1, pointerEvents: 'none',
                opacity: photoReveal ? 0 : 0.55, transition: 'opacity 0.30s ease',
              }}>
                <path d="M19 7V31M7 19H31" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Button area */}
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={handleStyleClick}
            style={{
              height: 44, padding: '0 22px',
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: 22,
              background: 'rgba(255,200,220,0.10)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 10px rgba(0,0,0,0.22)',
              color: 'rgba(255,255,255,0.88)',
              cursor: (phase === 'photo' || phase === 'done') ? 'pointer' : 'default',
              opacity: btnVisible ? 1 : 0,
              transform: btnVisible ? 'translateY(0px)' : 'translateY(14px)',
              transition: 'opacity 0.42s ease, transform 0.42s cubic-bezier(0.32,0.94,0.60,1)',
              pointerEvents: btnVisible ? 'auto' : 'none',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: 16, height: 16, position: 'relative', flexShrink: 0 }}>
              {/* Spark */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
                position: 'absolute', inset: 0,
                opacity:   iconSwap ? 0 : 1,
                transform: iconSwap ? 'scale(0) rotate(-30deg)' : 'scale(1) rotate(0deg)',
                transition: 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.55,0,1,1)',
              }}>
                <path
                  d="M8 0 C8 0 8.8 5.2 16 8 C8.8 10.8 8 16 8 16 C8 16 7.2 10.8 0 8 C7.2 5.2 8 0 8 0Z"
                  style={{ animation: (isProcessing && !isDone) ? 'sparkColorPulse 2.2s ease-in-out infinite' : 'none' }}
                  fill="rgba(255,255,255,0.85)"
                />
              </svg>
              {/* Checkmark */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
                position: 'absolute', inset: 0,
                opacity:   iconSwap ? 1 : 0,
                transform: iconSwap ? 'scale(1)' : 'scale(0)',
                transition: 'opacity 0.28s ease 0.12s, transform 0.40s cubic-bezier(0.34,1.56,0.64,1) 0.10s',
              }}>
                <path d="M2.5 8L6.5 12L13.5 4.5" pathLength="1"
                  stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ strokeDasharray: 1, strokeDashoffset: iconSwap ? 0 : 1, transition: iconSwap ? 'stroke-dashoffset 0.45s ease 0.18s' : 'none' }}
                />
              </svg>
            </div>
            <span key={btnLabel} style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.1px', animation: 'textSlideUp 0.28s ease' }}>
              {btnLabel}
            </span>
          </button>
        </div>

        {/* Bottom safe area — +50px raises button */}
        <div style={{ height: 74 }} />
      </div>
    </>
  );
}

// ── Controls ─────────────────────────────────────────────────────────────────

// ── Overview ──────────────────────────────────────────────────────────────────

function LightCard({ light, onToggle, onDetail, activeScene }: {
  light: LightSource;
  onToggle: (id: number) => void;
  onDetail: (light: LightSource, rect: DOMRect) => void;
  activeScene: number;
}) {
  const p = (SCENE_CARD_PALETTES[activeScene] ?? SCENE_CARD_PALETTES[0])[light.blobGroup];
  const a = (rgb: string, op: number) => rgb.replace('rgb(', 'rgba(').replace(')', `,${op})`);

  const sceneData    = light.sceneSettings?.[activeScene];
  const customHue    = sceneData?.customHue;
  const customSat    = sceneData?.customSaturation ?? 72;
  const effectiveBr  = Math.max(0.04, (sceneData?.brightness ?? light.brightness) / 100);
  const fogColor  = customHue !== undefined ? hslToRgb(customHue, 100, 48) : p.fog;
  const glowColor = customHue !== undefined ? hslToRgb(customHue, 100, 50) : p.glow;

  const borderGradient = light.on
    ? `linear-gradient(135deg, rgba(255,255,255,0.38) 0%, ${a(fogColor, 0.28)} 38%, rgba(255,255,255,0.08) 65%, ${a(glowColor, 0.20)} 100%)`
    : `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)`;

  return (
    <div
      onClick={(e) => onDetail(light, (e.currentTarget as HTMLElement).getBoundingClientRect())}
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
          <CardBlobs palette={p} brightness={effectiveBr} />
          {customHue !== undefined && (
            <div style={{
              position: 'absolute', inset: 0,
              background: `hsl(${customHue}, ${customSat}%, 52%)`,
              mixBlendMode: 'color',
              pointerEvents: 'none',
            }} />
          )}
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
  onDetail: (light: LightSource, rect: DOMRect) => void;
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

// ── Scene Schedule Sheet ──────────────────────────────────────────────────────

type FadeMode = 'instant' | 'smooth';

const SCHEDULE_TIMES: { label: string; minutes: number }[] = [
  { label: 'Сейчас',       minutes: 0  },
  { label: 'Через 15 мин', minutes: 15 },
  { label: 'Через 1 час',  minutes: 60 },
];

function SceneScheduleSheet({ activeScene, onClose, onConfirm, onTurnOffAll }: {
  activeScene: number;
  onClose: () => void;
  onConfirm: () => void;
  onTurnOffAll: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [exitSlow, setExitSlow] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(15);
  const [fadeMode, setFadeMode] = useState<FadeMode>('smooth');

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => { setExiting(true); setExitSlow(false); setTimeout(onClose, 380); };

  const handleConfirm = () => {
    if (selectedMinutes === 0) onTurnOffAll();
    setExiting(true); setExitSlow(true);
    onConfirm();
  };

  const isIn = entered && !exiting;
  const ease = 'cubic-bezier(0.32, 0.72, 0, 1)';

  const pal = SCENE_CARD_PALETTES[activeScene] ?? SCENE_CARD_PALETTES[0];
  const ta = (rgb: string, op: number) => rgb.replace('rgb(', 'rgba(').replace(')', `,${op})`);
  const accent  = pal[0].fog;
  const accent2 = pal[2].fog;
  const accentText = pal[0].ab2;

  const glassBase: React.CSSProperties = {
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '0.5px solid rgba(255,255,255,0.15)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 12px rgba(0,0,0,0.25)',
  };

  const chip = (active: boolean): React.CSSProperties => ({
    ...glassBase,
    height: 38, padding: '0 16px',
    borderRadius: 19,
    background: active ? ta(accent, 0.18) : 'rgba(255,255,255,0.06)',
    border: active ? `0.5px solid ${ta(accent, 0.55)}` : '0.5px solid rgba(255,255,255,0.13)',
    color: active ? accentText : 'rgba(255,255,255,0.68)',
    fontSize: 14, fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 42,
      background: [
        `radial-gradient(ellipse 70% 50% at 20% 25%, ${ta(accent, 0.07)} 0%, transparent 60%)`,
        `radial-gradient(ellipse 60% 45% at 80% 70%, ${ta(accent2, 0.05)} 0%, transparent 65%)`,
        'linear-gradient(to bottom, rgb(16,11,22) 0%, rgb(10,7,18) 100%)',
      ].join(', '),
      opacity:    isIn ? 1 : 0,
      transform:  isIn ? 'translateY(0px)' : exitSlow ? 'translateY(72px)' : 'translateY(56px)',
      filter:     isIn ? 'blur(0px)' : exitSlow ? 'blur(18px)' : 'blur(14px)',
      transition: isIn
        ? `opacity 0.34s ${ease}, transform 0.34s ${ease}, filter 0.34s ${ease}`
        : exitSlow
          ? 'opacity 0.28s ease-in, transform 0.28s ease-in, filter 0.28s ease-in'
          : `opacity 0.34s ${ease}, transform 0.34s ${ease}, filter 0.34s ${ease}`,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ height: 109, display: 'flex', alignItems: 'flex-end', paddingLeft: 16, paddingRight: 16, flexShrink: 0 }}>
        <button
          onClick={handleClose}
          style={{
            ...glassBase,
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
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
          Выключение света
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 20px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 68 }}>

        {/* When */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
            Выключить
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SCHEDULE_TIMES.map(opt => (
              <button
                key={opt.minutes}
                onClick={() => setSelectedMinutes(selectedMinutes === opt.minutes ? null : opt.minutes)}
                style={chip(selectedMinutes === opt.minutes)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fade */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
            Угасание
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['instant', 'smooth'] as FadeMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setFadeMode(mode)}
                style={chip(fadeMode === mode)}
              >
                {mode === 'instant' ? 'Сразу' : 'Плавно'}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Confirm button — pinned to bottom */}
      <div style={{ padding: '24px 20px 52px', flexShrink: 0, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <button
          onClick={handleConfirm}
          style={{
            height: 44, padding: '0 28px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderRadius: 22,
            background: ta(accent, 0.12),
            border: `0.5px solid ${ta(accent, 0.38)}`,
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 14px ${ta(accent, 0.18)}`,
            color: accentText,
            fontSize: 16, fontWeight: 500, letterSpacing: '-0.1px',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1V8" stroke={accentText} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M4.6 3.4A6.5 6.5 0 1 0 11.4 3.4" stroke={accentText} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          Выключить
        </button>
      </div>
    </div>
  );
}

function Controls({ onOverview, onSchedule }: { onOverview: () => void; onSchedule: () => void }) {
  const glassBase: React.CSSProperties = {
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: 'none',
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
      <button onClick={onSchedule} style={{ ...glassBase, position: 'absolute', right: 16, top: 0, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,200,220,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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

function BottomTray({ activeScene, logPos, onSceneChange, onNewStyle, sceneCustomData, allScenes }: {
  activeScene: number;
  logPos: number;
  onSceneChange: (i: number) => void;
  onNewStyle: () => void;
  sceneCustomData: { hue: number; saturation: number }[][];
  allScenes: SceneDef[];
}) {
  const allN = allScenes.length;
  const posToIdxLocal = (p: number) => ((p % allN) + allN) % allN;
  const dragX = useRef<number | null>(null);
  const onStart = (x: number) => { dragX.current = x; };
  const onEnd   = (x: number) => {
    if (dragX.current === null) return;
    const dx = x - dragX.current;
    dragX.current = null;
    if (dx < -45) onSceneChange((activeScene + 1) % allN);
    if (dx >  45) onSceneChange((activeScene - 1 + allN) % allN);
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
          const sceneIdx = posToIdxLocal(k);
          const scene    = allScenes[sceneIdx];
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
              {/* Blurred gradient glow */}
              <div style={{
                position:      'absolute',
                borderRadius:  '50%',
                background:    scene.sphere.gradient,
                filter:        'blur(13px)',
                opacity:       d === 0 ? 0.12 : 0,
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
                  boxShadow:  scene.sphere.glassInset ?? scene.sphere.glow ?? "none",
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
                {(sceneCustomData[sceneIdx] ?? []).map((custom, i) => (
                  <span key={i} style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: `radial-gradient(ellipse 90% 80% at 40% 35%, hsl(${custom.hue}, ${custom.saturation}%, 65%) 0%, hsl(${custom.hue}, ${custom.saturation}%, 55%) 45%, transparent 100%)`,
                    mixBlendMode: 'screen',
                    opacity: 0.62,
                    pointerEvents: 'none',
                  }} />
                ))}
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
