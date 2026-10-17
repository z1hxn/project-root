# Virtual Web Routing Rules

실제 서비스 이름을 기반으로 한 게임용 Virtual Web fixture다. 허구 계정 데이터를 실제 서비스에 생성하거나 전송하지 않는다.

## 오류 구분

1. 등록되지 않은 domain → Firefox 자체 network/DNS error
2. 등록된 service + 존재하지 않는 user/repo/post → 해당 서비스 자체 Not Found UI
3. 권한 필요 → 해당 서비스의 auth/permission UI
4. 정상 route → 서비스 UI

예를 들어 `threads.net/@does_not_exist`에 해당하는 Virtual Web route는 Firefox 오류가 아니라 Threads의 `User not found` 화면을 렌더링한다.

## 서비스 기본 화면

GitHub와 Threads는 특정 미션 URL뿐 아니라 Home/Search/Profile/Post/Repository 등 기본 navigation을 제공한다. fixture에 없는 일반 콘텐츠도 정답과 무관한 범위에서 충분히 제공하되 미션 핵심 증거는 이 pack의 fixture를 source-of-truth로 사용한다.
