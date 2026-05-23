<script setup lang="ts">
import TopMessageController from '@/components/top-message/TopMessageController.vue'
import TopMessageView from '@/components/top-message/TopMessageView.vue'
</script>

<template>
  <UpRootView />
  <top-message-controller v-slot="{ visible, message, messageType, icon, topOffsetPx }">
    <top-message-view
      :visible="visible"
      :message="message"
      :message-type="messageType"
      :icon="icon"
      :top-offset-px="topOffsetPx"
    />
  </top-message-controller>
</template>
