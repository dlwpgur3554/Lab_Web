-- notices.author_id 를 NULL 허용으로 변경하고
-- FK를 ON DELETE SET NULL 로 재생성하는 스크립트 (MySQL)

-- 1) 현재 FK 이름 확인 (결과에서 CONSTRAINT_NAME 확인)
--    실행: SHOW CREATE TABLE notices\G

-- 2) FK 드롭 (아래에서 `FK_NAME_HERE` 를 1번에서 확인한 실제 이름으로 바꾸세요)
-- ALTER TABLE notices DROP FOREIGN KEY `FK_NAME_HERE`;

-- 3) author_id 컬럼을 NULL 허용으로 변경
--    author_id 타입은 환경에 따라 BIGINT/INT 일 수 있습니다. 현재는 BIGINT 가정
ALTER TABLE notices MODIFY COLUMN author_id BIGINT NULL;

-- 4) FK 재생성: ON DELETE SET NULL
-- ALTER TABLE notices
--   ADD CONSTRAINT `FK_NAME_HERE`
--   FOREIGN KEY (author_id) REFERENCES members(id)
--   ON DELETE SET NULL
--   ON UPDATE CASCADE;

-- 참고: 위 작업 후, 애플리케이션에서 멤버 삭제 시
--  - 우리 코드가 먼저 author_id 를 null 로 업데이트
--  - 그 다음 members 삭제
-- 로 동작하며, FK 도 SET NULL 로 안전하게 동작합니다.


