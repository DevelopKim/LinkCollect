/**
 * Background Service Worker
 * 확장 기능의 백그라운드 작업을 처리하는 서비스 워커
 */

// 확장 기능 설치 시 초기화
chrome.runtime.onInstalled.addListener(() => {
  console.log('링크 수집기 확장 기능이 설치되었습니다.');
});

// 확장 기능 아이콘 클릭 시 사이드 패널 열기
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
