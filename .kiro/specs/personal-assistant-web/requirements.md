# Requirements Document

## Introduction

Personal_Assistant_Web là một ứng dụng web trợ lý cá nhân dành cho một người dùng duy nhất (single user), được triển khai trên Vercel với backend Node.js và frontend Next.js, dữ liệu lưu trên Vercel Postgres thông qua Prisma ORM.

Ứng dụng cung cấp một dashboard tổng hợp gồm:

- Quản lý danh sách công việc cá nhân (To_Do).
- Quản lý danh sách cuộc họp (Meeting) nhập tay.
- Quản lý danh sách dự án (Project) đang thực hiện và các To_Do thuộc từng dự án.
- Hiển thị thông tin giá cổ phiếu HPG lấy từ VnStock API.
- Hiển thị các tin tức chính trị, chính sách "nóng" trong 24 giờ qua, lấy từ Google News RSS theo từ khóa.
- Giao diện song ngữ Việt - Anh, người dùng có thể chuyển đổi giữa hai ngôn ngữ.

Người dùng đăng nhập bằng username và password. Vì là ứng dụng single-user, hệ thống chỉ phục vụ một tài khoản chủ duy nhất; không có chức năng tự đăng ký công khai.

## Glossary

- **Personal_Assistant_Web**: Toàn bộ hệ thống ứng dụng web trợ lý cá nhân, bao gồm frontend Next.js, backend Node.js (Next.js API routes hoặc Route Handlers), và cơ sở dữ liệu Vercel Postgres.
- **Auth_Service**: Thành phần phía backend chịu trách nhiệm xác thực username/password và quản lý phiên đăng nhập.
- **Session**: Trạng thái đăng nhập đã xác thực của người dùng, được duy trì bằng cookie HTTP-only đã ký.
- **Owner**: Tài khoản người dùng duy nhất của hệ thống, được khởi tạo trước (seed) trong cơ sở dữ liệu.
- **Dashboard**: Trang chính sau khi đăng nhập, hiển thị tổng hợp To_Do, Meeting, Project, giá HPG và tin tức.
- **To_Do**: Một mục công việc với các thuộc tính tối thiểu: id, title, status, project_id (tùy chọn), created_at, updated_at.
- **To_Do_Status**: Trạng thái của một To_Do, nhận một trong các giá trị: `not_started`, `in_progress`, `done`.
- **Meeting**: Một cuộc họp do người dùng nhập tay, gồm: id, title, start_time, end_time, attendees (danh sách chuỗi), notes (tùy chọn), created_at, updated_at.
- **Project**: Một dự án với các thuộc tính: id, name, status, description (tùy chọn), created_at, updated_at.
- **Project_Status**: Trạng thái dự án, nhận một trong các giá trị: `planned`, `in_progress`, `paused`, `completed`.
- **HPG_Quote_Service**: Thành phần phía backend gọi VnStock API để lấy giá cổ phiếu mã HPG.
- **HPG_Quote**: Bản ghi giá cổ phiếu HPG gồm: symbol (`HPG`), price, change, change_percent, volume, as_of_time, source.
- **News_Service**: Thành phần phía backend lấy tin tức chính trị và chính sách từ Google News RSS theo từ khóa.
- **News_Item**: Một mục tin tức gồm: id, title, source, url, published_at, language, category (`politics` hoặc `policy`).
- **News_Keyword_Set**: Tập hợp từ khóa tiếng Việt và tiếng Anh dùng để truy vấn Google News RSS, được cấu hình trong server.
- **Locale**: Ngôn ngữ hiển thị của giao diện, nhận một trong các giá trị: `vi`, `en`.
- **VnStock_API**: Dịch vụ bên thứ ba cung cấp dữ liệu giá cổ phiếu thị trường Việt Nam.
- **Google_News_RSS**: Dịch vụ RSS công khai của Google News dùng để lấy tin tức theo từ khóa và khoảng thời gian.

## Requirements

### Requirement 1: Đăng nhập một tài khoản (single-user authentication)

**User Story:** Là Owner, tôi muốn đăng nhập bằng username và password, để chỉ tôi có thể truy cập dữ liệu cá nhân trong Personal_Assistant_Web.

#### Acceptance Criteria

1. WHEN Owner gửi yêu cầu đăng nhập với username và password đúng, THE Auth_Service SHALL khởi tạo một Session và đặt cookie phiên HTTP-only, Secure.
2. IF Owner gửi yêu cầu đăng nhập với username hoặc password không đúng, THEN THE Auth_Service SHALL từ chối đăng nhập và trả về thông báo lỗi không tiết lộ trường nào sai.
3. WHEN một yêu cầu HTTP đến bất kỳ trang hoặc API nào ngoài trang đăng nhập mà không có Session hợp lệ, THE Personal_Assistant_Web SHALL chuyển hướng về trang đăng nhập hoặc trả về mã trạng thái 401.
4. THE Auth_Service SHALL lưu password của Owner dưới dạng hash bằng thuật toán bcrypt với cost factor tối thiểu 10.
5. WHEN Owner bấm đăng xuất, THE Auth_Service SHALL hủy Session phía server và xóa cookie phiên trên trình duyệt.
6. IF có quá 5 lần đăng nhập sai liên tiếp trong 10 phút từ cùng một IP, THEN THE Auth_Service SHALL chặn các yêu cầu đăng nhập tiếp theo từ IP đó trong 15 phút.

### Requirement 2: Quản lý To_Do

**User Story:** Là Owner, tôi muốn tạo, xem, cập nhật và xóa các To_Do với tiêu đề và trạng thái, để theo dõi công việc cá nhân hằng ngày.

#### Acceptance Criteria

1. WHEN Owner tạo một To_Do với title không rỗng và status thuộc To_Do_Status, THE Personal_Assistant_Web SHALL lưu To_Do mới với status mặc định `not_started` nếu Owner không cung cấp status.
2. IF Owner gửi yêu cầu tạo To_Do với title rỗng hoặc dài quá 200 ký tự, THEN THE Personal_Assistant_Web SHALL từ chối yêu cầu và trả về lỗi xác thực mô tả trường vi phạm.
3. WHEN Owner cập nhật status của một To_Do sang một giá trị thuộc To_Do_Status, THE Personal_Assistant_Web SHALL lưu giá trị mới và cập nhật trường updated_at theo thời gian máy chủ.
4. IF Owner cập nhật status của một To_Do sang giá trị không thuộc To_Do_Status, THEN THE Personal_Assistant_Web SHALL từ chối yêu cầu và trả về lỗi xác thực.
5. WHEN Owner xóa một To_Do, THE Personal_Assistant_Web SHALL xóa bản ghi đó khỏi cơ sở dữ liệu và không hiển thị lại trên Dashboard.
6. THE Personal_Assistant_Web SHALL hiển thị danh sách To_Do hiện có của Owner (không bao gồm các To_Do đã bị xóa) trên Dashboard, sắp xếp theo updated_at giảm dần.
7. WHERE một To_Do được tạo trong ngữ cảnh của một Project (project_id được cung cấp), THE Personal_Assistant_Web SHALL gắn To_Do đó với Project tương ứng.

### Requirement 3: Quản lý Meeting

**User Story:** Là Owner, tôi muốn nhập tay danh sách cuộc họp với thời gian và người tham dự, để có lịch họp tổng hợp.

#### Acceptance Criteria

1. WHEN Owner tạo một Meeting với title không rỗng, start_time và end_time thỏa mãn end_time lớn hơn hoặc bằng start_time, THE Personal_Assistant_Web SHALL lưu Meeting mới.
2. IF Owner tạo hoặc cập nhật một Meeting có end_time nhỏ hơn start_time, THEN THE Personal_Assistant_Web SHALL từ chối yêu cầu và trả về lỗi xác thực mô tả ràng buộc thời gian.
3. WHEN Owner cập nhật một Meeting đã tồn tại, THE Personal_Assistant_Web SHALL chỉ cho phép sửa các trường title, start_time, end_time, attendees, notes và cập nhật updated_at.
4. WHEN Owner xóa một Meeting, THE Personal_Assistant_Web SHALL xóa bản ghi đó khỏi cơ sở dữ liệu.
5. THE Personal_Assistant_Web SHALL hiển thị Meeting trên Dashboard, sắp xếp theo start_time tăng dần và mặc định chỉ hiển thị các Meeting có end_time lớn hơn hoặc bằng thời điểm hiện tại.
6. WHEN Owner lưu danh sách attendees của một Meeting, THE Personal_Assistant_Web SHALL chấp nhận tối đa 50 chuỗi, mỗi chuỗi tối đa 100 ký tự.

### Requirement 4: Quản lý Project và To_Do của Project

**User Story:** Là Owner, tôi muốn tạo và theo dõi các Project với trạng thái và các To_Do gắn với từng Project, để biết dự án nào đang thực hiện và việc gì cần làm cho từng dự án.

#### Acceptance Criteria

1. WHEN Owner tạo một Project với name không rỗng và status thuộc Project_Status, THE Personal_Assistant_Web SHALL lưu Project mới với status mặc định `planned` nếu Owner không cung cấp status.
2. IF Owner tạo hoặc cập nhật Project với status không thuộc Project_Status, THEN THE Personal_Assistant_Web SHALL từ chối yêu cầu và trả về lỗi xác thực.
3. WHEN Owner cập nhật status của một Project, THE Personal_Assistant_Web SHALL lưu giá trị mới và cập nhật updated_at.
4. WHEN Owner mở chi tiết một Project, THE Personal_Assistant_Web SHALL hiển thị danh sách các To_Do có project_id bằng id của Project đó, sắp xếp theo updated_at giảm dần.
5. WHEN Owner xóa một Project, THE Personal_Assistant_Web SHALL gỡ liên kết các To_Do thuộc Project đó bằng cách đặt project_id của chúng về null, sau đó xóa Project.
6. THE Personal_Assistant_Web SHALL hiển thị danh sách Project có status bằng `in_progress` trên Dashboard, sắp xếp theo updated_at giảm dần.
7. WHEN Owner tạo một To_Do từ trang chi tiết của một Project, THE Personal_Assistant_Web SHALL tự động gán project_id của To_Do mới bằng id của Project đang xem.

### Requirement 5: Hiển thị giá cổ phiếu HPG từ VnStock API

**User Story:** Là Owner, tôi muốn xem giá cổ phiếu HPG mới nhất trên Dashboard, để theo dõi tình hình thị trường mà không cần mở ứng dụng khác.

#### Acceptance Criteria

1. WHEN Dashboard được tải, THE HPG_Quote_Service SHALL trả về một HPG_Quote gồm symbol `HPG`, price, change, change_percent, volume, as_of_time và source `VnStock`.
2. THE HPG_Quote_Service SHALL lưu cache HPG_Quote tối đa 60 giây và trả về dữ liệu từ cache nếu thời gian từ as_of_time của bản ghi cache nhỏ hơn 60 giây.
3. IF VnStock_API trả về lỗi hoặc không phản hồi trong vòng 5 giây, THEN THE HPG_Quote_Service SHALL trả về HPG_Quote gần nhất trong cache kèm cờ `stale=true`, hoặc trả về lỗi dịch vụ nếu không có bản cache nào.
4. WHEN HPG_Quote được hiển thị, THE Personal_Assistant_Web SHALL hiển thị as_of_time của bản ghi và một chỉ báo trực quan khi `stale=true`.
5. THE Personal_Assistant_Web SHALL không gọi VnStock_API trực tiếp từ trình duyệt; mọi yêu cầu lấy HPG_Quote SHALL đi qua HPG_Quote_Service phía server.

### Requirement 6: Tin tức chính trị và chính sách 24 giờ qua

**User Story:** Là Owner, tôi muốn xem các tin tức chính trị và chính sách nổi bật trong 24 giờ qua, để cập nhật nhanh tình hình.

#### Acceptance Criteria

1. WHEN Dashboard được tải, THE News_Service SHALL trả về danh sách News_Item có published_at nằm trong khoảng 24 giờ tính từ thời điểm yêu cầu.
2. THE News_Service SHALL truy vấn Google_News_RSS bằng từ khóa định nghĩa trong News_Keyword_Set, gồm các từ khóa cho `politics` và `policy` ở cả `vi` và `en`.
3. THE News_Service SHALL gán trường category cho mỗi News_Item dựa trên từ khóa đã dùng để truy vấn, nhận giá trị `politics` hoặc `policy`.
4. WHEN hai News_Item có cùng url, THE News_Service SHALL chỉ giữ một News_Item duy nhất theo published_at mới nhất.
5. THE News_Service SHALL trả về tối đa 20 News_Item, sắp xếp theo published_at giảm dần.
6. THE News_Service SHALL lưu cache kết quả tối đa 10 phút và trả về dữ liệu từ cache nếu chưa hết hạn.
7. IF Google_News_RSS trả về lỗi hoặc không phản hồi trong vòng 8 giây, THEN THE News_Service SHALL trả về danh sách News_Item từ cache gần nhất kèm cờ `stale=true`, hoặc danh sách rỗng nếu không có cache.
8. THE Personal_Assistant_Web SHALL hiển thị mỗi News_Item kèm title, source, published_at và đường dẫn mở trong tab mới với thuộc tính `rel="noopener noreferrer"`.

### Requirement 7: Giao diện song ngữ Việt - Anh

**User Story:** Là Owner, tôi muốn chuyển đổi giao diện giữa tiếng Việt và tiếng Anh, để sử dụng ngôn ngữ phù hợp với ngữ cảnh.

#### Acceptance Criteria

1. THE Personal_Assistant_Web SHALL hỗ trợ hai Locale: `vi` và `en`, với `vi` là Locale mặc định khi Owner truy cập lần đầu.
2. WHEN Owner chọn một Locale, THE Personal_Assistant_Web SHALL áp dụng Locale đó cho mọi nhãn giao diện và lưu lựa chọn vào cookie hoặc localStorage để sử dụng cho các phiên sau.
3. THE Personal_Assistant_Web SHALL có bản dịch đầy đủ cho mọi nhãn giao diện ở cả hai Locale; mỗi khóa dịch SHALL có giá trị không rỗng ở cả `vi` và `en`.
4. WHEN một News_Item được hiển thị, THE Personal_Assistant_Web SHALL giữ nguyên nội dung tiêu đề và nguồn theo dữ liệu gốc từ Google_News_RSS, không dịch tự động.
5. THE Personal_Assistant_Web SHALL hiển thị thời gian (as_of_time, published_at, start_time, end_time, updated_at) theo định dạng phù hợp với Locale đang chọn và theo múi giờ Asia/Ho_Chi_Minh.

### Requirement 8: Triển khai trên Vercel với Next.js và Vercel Postgres

**User Story:** Là Owner, tôi muốn ứng dụng được triển khai trên Vercel bằng Next.js và lưu dữ liệu trên Vercel Postgres qua Prisma, để dễ vận hành và mở rộng.

#### Acceptance Criteria

1. THE Personal_Assistant_Web SHALL được triển khai trên Vercel dưới dạng ứng dụng Next.js, sử dụng Node.js làm runtime cho các route phía server.
2. THE Personal_Assistant_Web SHALL lưu dữ liệu Owner, To_Do, Meeting và Project trong Vercel Postgres, truy cập qua Prisma ORM.
3. THE Personal_Assistant_Web SHALL đọc cấu hình kết nối cơ sở dữ liệu, khóa bí mật phiên và thông tin tài khoản Owner từ biến môi trường, không hardcode trong mã nguồn.
4. WHEN ứng dụng được triển khai mới, THE Personal_Assistant_Web SHALL chạy migration của Prisma để tạo các bảng cần thiết trước khi xử lý yêu cầu HTTP.
5. WHERE biến môi trường khởi tạo Owner được cung cấp (username và password ban đầu), THE Personal_Assistant_Web SHALL tạo bản ghi Owner duy nhất nếu chưa tồn tại, lưu password ở dạng hash bcrypt.
6. IF biến môi trường bắt buộc bị thiếu khi khởi động, THEN THE Personal_Assistant_Web SHALL ghi log lỗi mô tả biến nào thiếu và từ chối phục vụ yêu cầu HTTP.

### Requirement 9: Bảo vệ API và phân quyền Owner

**User Story:** Là Owner, tôi muốn mọi API dữ liệu chỉ phục vụ phiên đã đăng nhập của tôi, để dữ liệu cá nhân không bị truy cập trái phép.

#### Acceptance Criteria

1. WHEN một yêu cầu HTTP đến API quản lý To_Do, Meeting hoặc Project mà không có Session hợp lệ, THE Personal_Assistant_Web SHALL trả về mã trạng thái 401 và không thực hiện thao tác.
2. THE Personal_Assistant_Web SHALL gắn mọi bản ghi To_Do, Meeting và Project với Owner duy nhất và từ chối các thao tác đọc, cập nhật, xóa nếu owner_id của bản ghi không khớp với Owner trong Session.
3. THE Personal_Assistant_Web SHALL áp dụng bảo vệ CSRF cho mọi yêu cầu thay đổi trạng thái (POST, PUT, PATCH, DELETE) bằng cookie SameSite=Lax kết hợp token CSRF được kiểm tra phía server, không có cờ cấu hình tắt tính năng này.
4. THE Personal_Assistant_Web SHALL ghi log các sự kiện đăng nhập thành công, đăng nhập thất bại và đăng xuất kèm timestamp và IP.

