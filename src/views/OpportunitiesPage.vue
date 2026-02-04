<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;">
        <div>
          <h2>🔍 策略筛选</h2>
          <p>查看私募级策略的最新扫描结果与机会挖掘</p>
        </div>
      </div>
    </section>

    <!-- 策略中心看板 -->
    <section class="strategy-management">
      <div class="strategy-management__head">
        <div>
          <h3>⚙️ 策略概览</h3>
          <p>浏览系统内置的私募精选策略逻辑</p>
        </div>
      </div>
      <div class="strategy-management__body">
        <div v-if="strategies.length" class="strategy-grid">
          <StrategyCard
            v-for="strategy in strategies"
            :key="strategy.id"
            :strategy="strategy"
            @view="handleViewLatestResults"
          />
        </div>
 <template>
  <div class="page-container">
    <section class="section-header">
      <div style.<  <div cl      <section class="section-hct      <div style="display: flex; ju->        <div>
          <h2>🔍 策略筛选</h2>
          <p>查看私募级策略的最新扫描?r           <di          <p>查看私募级策略?>        </div>
      </div>
    </section>

    <!-- 策略中心看板 -??      </div>
an    </secti/d
    <!-- 策p c    <section class="strategy-m?:  { recentStrategyRun.finished_at ? format        <div>
          <h3>⚙️ 策略概??          <h}<          <p>浏览系统内置Strategy        </div>
      </div>
      <div class="strategy-managetS      </div>
        <div s=        <div v-if="strategies.length"handleExp          <StrategyCard
            v-for="strategy in strasu            v-for="strct            :key="strategy.id"
          g"            :strategy="      <p      ?没有已发布的策略?         />
        </div>
 <tem?认定时任务是否?<template>
     <div cla      <section class="section-h        <divyResultsModal
      :show="          <h2>🔍 策略筛选</h2>
          <p>查看私募级策略的最新扫描?r           <di      fa          <p>查看私募级策略?-      </div>
    </section>

    <!-- 策略中心看板 -??      </div>
an    </secti/d
    <!-- 策p c    <section;
    </sectirt
    <!-- 策inean    </secti/d
    <!-- 策p c    <sectioe.    <
import Str          <h3>⚙️ 策略概??          <h}<          <p>浏览系统内置Strategy        </div>
 at      </div>
      <div class="strategy-managetS      </div>
        <div s=        <div v-if="strim      <div tc        <div s=        <div v-if="strategies.lSt            v-for="strategy in strasu            v-for="strct            :key="straun          g"            :strategy="      <p      ?没有已发布的策略?         />
 tr        </div>
 <tem?认定时任务是否?<template>
     <div cla      <section cla'' <tem?认定?t     <div cla      <section class="sect |      :show="          <h2>🔍 策略筛选</h2>
          <p>?]>([]          <p>查看私募级策略的最新扫?o    </section>

    <!-- 策略中心看板 -??      </div>
an    </secti/d
    <!-- 策p c    <section;
    </sectirt
   fo
    <!-- 策isoan    </secti/d
    <!-- 策p c    <sectioew    <!-- 策p g)    </sectirt
    <!-- 策i()    <!-- 策.g    <!-- 策p c    <sectioe. ${import Str          <h3>⚙️ ?t at      </div>
      <div class="strategy-managetS      </div>
        <div s=        <div v-if="strim     
       <div clast        <divawait fetchStrategies({ limit: 6 }); tr        </div>
 <tem?认定时任务是否?<template>
     <div cla      <section cla'' <tem?认定?t     <div cla      <section class="sect |      :show="          <h2>🔍 策略筛选</h2>
          <p>?]>([]          <p>查看私募级策略的最新扫?o    tr <tem?认定时?p     <div cla      <section cla'' <tem?            <p>?]>([]          <p>查看私募级策略的最新扫?o    </section>

    <!-- 策略中心看板 -??      </div>
an    <  
    <!-- 策略中心看板 -??      </div>
an    </secti/d
    <!-- 策p c    <sesynan    </secti/d
    <!-- 策p c    unId: str ng) {
  try {
     </sectirt
   fo
    <!-et   fo
    <!nR    ts    <!-- 策p c    <sectioew s.    <!-- 策i()    <!-- 策.g    <!-- 策p c    <sectioeso      <div class="strategy-managetS      </div>
        <div s=        <div v-if="strim     
       <div clag)        <div s=        <div v-if="strim     
 at       <div clast        <divawait fetchStr = <tem?认定时任务是否?<template>
     <div cla      <section cla'' <tem???     <div cla      <section cla'' <tem?Ex          <p>?]>([]          <p>查看私募级策略的最新扫?o    tr <tem?认定时?p     <div cla      <section cla'' <tem?    ai
    <!-- 策略中心看板 -??      </div>
an    <  
    <!-- 策略中心看板 -??      </div>
an    </secti/d
    <!-- 策p c    <sesynan    </secti/d
    <!-- 策p c    unId: str ng) {
  try {
     </sectirt
   ftegan    <  
    <!-- 策略中心看板 -?? va    <!--nIan    </secti/d
    <!-- 策p c    <sesynaMo    <!-- 策p ue    <!-- 策p c    unId: str ng) {
  tr
f  try {
     </sectirt
   fo
     {     <(r   fo
    <!-Ru    lu    <!nR    t          <div s=        <div v-if="strim     
       <div clag)        <div s=        <div v-if="strim     
 at       <div clast        <divawait fetcst       <div clag)        <div s=        <diex at       <div clast        <divawait fetchStr = <tem?认定
.     <div cla      <section cla'' <tem???     <div cla      <section cla'' <tem?Ex    ti    <!-- 策略中心看板 -??      </div>
an    <  
    <!-- 策略中心看板 -??      </div>
an    </secti/d
    <!-- 策p c    <sesynan    </secti/d
    <!-- 策p c    unId: str ng) {
  try {
     </sectirt
   ftegamean    <  
    <!-- 策略中心看板 -?? 6;    <!--atan    </secti/d
    <!-- 策p c    <sesyna
     <!-- 策p 85    <!-- 策p c    unId: str ng) {
  trnagement__body {
  margin-top: 16px;
     <ra   ftegan     d    <!-- 策略 g    <!-- 策p c    <sesynaMo    <!-- 策p ue    <!-- 策p );  tr
f  try {
     </sectirt
   fo
     {     <(r   fo
    <!-Ru    lu    <!neaf  ra     </35   fo
  a(30, 4    9,    <!-Ru    lu   ,        <div clag)        <div s=        <div v-if="stri;
  border-radius: 1 at       <div clast        <divawait fetcst       <div clags-.     <div cla      <section cla'' <tem???     <div cla      <section cla'' <tem?Ex    ti    <!-- 策略中心看板 -??      </div>
an    < font-sizan    <  
    <!-- 策略中心看板 -??      </div>
an    </secti/d
    <!-- 策p c    <sesynan    </secti/d
    <!-- 策p c    undi    <px 8pan    </secti/d
    <!-- 策p c    <sesynali    <!-- 策p ,     <!-- 策p c    unId: str ng) {
  tr
   try {
     </sectirt
   ftegametl     <ma   ftegamean ;
    <!-- 策略中      <!-- 策p c    <sesyna
     <!-- 策p 85    <!-- 策p te     <!-- 策p 85    <!--:   trnagement__body {
  margin-top: 16px;
     <ra rd  margius: 12px;
  bo     <ra   ftegan gbf  try {
     </sectirt
   fo
     {     <(r   fo
    <!-Ru    lu    <!neaf  ra     </35   fo
  a(30, 4;
   
}
</s   f>
