<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <header class="neo-box header">
      <h1>CHORD<br>COORDINATOR</h1>
      <nav class="nav-bar">
        <RouterLink to="/" class="nav-link" active-class="active">ANALYZER</RouterLink>
        <RouterLink to="/tuner" class="nav-link" active-class="active">TUNER</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-quaternary);
  flex-wrap: wrap; /* Handle mobile */
  gap: 1rem;

  h1 {
    margin: 0;
    line-height: 0.9;
    font-size: 3rem;
    text-transform: uppercase;
    font-family: var(--font-heading);
  }
}

.nav-bar {
    display: flex;
    gap: 1rem;
}

.nav-link {
    text-decoration: none;
    font-family: var(--font-heading);
    font-size: 1.5rem;
    color: var(--color-text);
    padding: 0.5rem 1rem;
    border: var(--border-width) solid transparent;
    transition: all 0.2s;

    &:hover {
        background: rgba(255,255,255,0.2);
    }

    &.active {
        background: var(--color-primary);
        color: white;
        border: var(--border-width) solid var(--color-border);
        box-shadow: 2px 2px 0 var(--color-border);
    }
}
</style>
