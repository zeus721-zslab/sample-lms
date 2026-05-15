<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>수료 자격증 — {{ $issue->certificate->name }}</title>
    <style>
        @page { margin: 0; size: A4 portrait; }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html, body {
            margin: 0;
            padding: 0;
        }

        body {
            font-family: NanumGothic, DejaVu Sans, sans-serif;
            background: #fff;
            color: #1a1a2e;
            width: 794px;
            height: 1123px;
            position: relative;
            overflow: hidden;
        }

        /* ── 배경 장식 ── */
        .bg-pattern {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background:
                linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f8f0ff 100%);
            z-index: 0;
        }

        .border-outer {
            position: absolute;
            top: 18px; left: 18px; right: 18px; bottom: 18px;
            border: 3px solid #3b5bdb;
            border-radius: 4px;
            z-index: 1;
        }

        .border-inner {
            position: absolute;
            top: 26px; left: 26px; right: 26px; bottom: 26px;
            border: 1px solid #a5b4fc;
            border-radius: 2px;
            z-index: 1;
        }

        /* ── 콘텐츠 래퍼 ── */
        .content {
            position: relative;
            z-index: 2;
            padding: 60px 72px 0;
            text-align: center;
        }

        /* ── 로고 영역 ── */
        .logo-area {
            text-align: center;
            margin-bottom: 18px;
        }

        .logo-text {
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #3b5bdb;
            text-transform: uppercase;
        }

        .logo-sub {
            font-size: 11px;
            letter-spacing: 2px;
            color: #6c757d;
            margin-top: 2px;
        }

        /* ── 구분선 ── */
        .divider {
            width: 100%;
            height: 1px;
            background: linear-gradient(to right, transparent, #3b5bdb, transparent);
            margin: 14px 0;
        }

        /* ── 타이틀 ── */
        .cert-title {
            font-size: 40px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #1a1a2e;
            text-align: center;
            margin: 6px 0 22px;
        }

        /* ── 수여 문구 ── */
        .award-text {
            font-size: 13px;
            color: #495057;
            text-align: center;
            line-height: 1.8;
            margin-bottom: 16px;
        }

        /* ── 수여자명 ── */
        .recipient-name {
            font-size: 34px;
            font-weight: bold;
            color: #1a1a2e;
            text-align: center;
            border-bottom: 2px solid #3b5bdb;
            padding-bottom: 8px;
            margin-bottom: 16px;
            display: inline-block;
            min-width: 320px;
        }

        /* ── 자격증명 박스 ── */
        .cert-name-box {
            background: #eef2ff;
            border: 1px solid #c5d0fc;
            border-radius: 4px;
            padding: 12px 40px;
            text-align: center;
            margin-bottom: 22px;
            display: inline-block;
        }

        .cert-name-label {
            font-size: 11px;
            color: #6c757d;
            letter-spacing: 2px;
            margin-bottom: 6px;
        }

        .cert-name-value {
            font-size: 19px;
            font-weight: bold;
            color: #3b5bdb;
        }

        /* ── 메타 정보 그리드 ── */
        .meta-grid {
            width: 100%;
            margin-bottom: 0;
        }

        .meta-grid table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta-grid td {
            padding: 6px 16px;
            font-size: 12px;
            vertical-align: middle;
        }

        .meta-label {
            color: #6c757d;
            width: 110px;
            font-size: 11px;
            letter-spacing: 1px;
            text-align: left;
        }

        .meta-value {
            color: #1a1a2e;
            font-weight: bold;
            text-align: left;
        }

        .meta-separator {
            color: #c5d0fc;
            width: 20px;
            text-align: center;
        }

        /* ── 하단 영역 (절대 위치) ── */
        .footer-area {
            position: absolute;
            bottom: 72px;
            left: 72px;
            right: 72px;
            z-index: 2;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            vertical-align: bottom;
            padding: 0;
        }

        /* ── QR 섹션 ── */
        .qr-section {
            text-align: left;
        }

        .qr-wrapper {
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 8px;
            background: #fff;
            display: inline-block;
            margin-bottom: 5px;
        }

        .qr-wrapper img,
        .qr-wrapper svg {
            display: block;
            width: 88px;
            height: 88px;
        }

        .qr-label {
            font-size: 9px;
            color: #868e96;
            letter-spacing: 0.5px;
            text-align: center;
        }

        /* ── 발급기관 서명 ── */
        .issuer-section {
            text-align: center;
        }

        .issuer-name {
            font-size: 16px;
            font-weight: bold;
            color: #1a1a2e;
            letter-spacing: 2px;
            margin-bottom: 4px;
        }

        .issuer-title {
            font-size: 11px;
            color: #6c757d;
            margin-bottom: 10px;
        }

        .stamp-circle {
            width: 72px;
            height: 72px;
            border: 3px solid #3b5bdb;
            border-radius: 36px;
            margin: 0 auto;
            padding-top: 16px;
        }

        .stamp-text {
            font-size: 9px;
            font-weight: bold;
            color: #3b5bdb;
            letter-spacing: 1px;
            text-align: center;
            line-height: 1.5;
        }

        /* ── 일련번호 푸터 ── */
        .serial-footer {
            position: absolute;
            bottom: 32px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #adb5bd;
            letter-spacing: 2px;
            z-index: 2;
        }
    </style>
</head>
<body>
    <div class="bg-pattern"></div>
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <div class="content">

        <!-- 로고 -->
        <div class="logo-area">
            <div class="logo-text">zslab Academy</div>
            <div class="logo-sub">ONLINE LEARNING MANAGEMENT SYSTEM</div>
        </div>

        <div class="divider"></div>

        <!-- 타이틀 -->
        <div class="cert-title">수 료 증</div>

        <!-- 수여 문구 -->
        <div class="award-text">
            아래 분은 zslab Academy에서 개설한 교육 과정을 성실히 이수하고<br>
            소정의 평가 기준을 통과하였기에 이 자격증을 수여합니다.
        </div>

        <!-- 수여자명 -->
        <div class="recipient-name">{{ $issue->user->name }}</div>

        <!-- 자격증명 -->
        <div class="cert-name-box">
            <div class="cert-name-label">취득 자격 과정</div>
            <div class="cert-name-value">{{ $issue->certificate->name }}</div>
        </div>

        <!-- 메타 정보 -->
        <div class="meta-grid">
            <table>
                <tr>
                    <td class="meta-label">발급기관</td>
                    <td class="meta-separator">|</td>
                    <td class="meta-value">{{ $issue->certificate->issuer }}</td>
                </tr>
                <tr>
                    <td class="meta-label">발급일</td>
                    <td class="meta-separator">|</td>
                    <td class="meta-value">{{ $issue->issued_at->format('Y년 m월 d일') }}</td>
                </tr>
                @if($issue->expires_at)
                <tr>
                    <td class="meta-label">유효기간</td>
                    <td class="meta-separator">|</td>
                    <td class="meta-value">{{ $issue->expires_at->format('Y년 m월 d일') }}까지</td>
                </tr>
                @endif
                <tr>
                    <td class="meta-label">일련번호</td>
                    <td class="meta-separator">|</td>
                    <td class="meta-value" style="font-family: DejaVu Sans, monospace; font-size: 13px; color: #3b5bdb;">
                        {{ $issue->serial_no }}
                    </td>
                </tr>
            </table>
        </div>

    </div>

    <!-- 하단: QR + 서명 (절대 위치) -->
    <div class="footer-area">
        <table class="footer-table">
            <tr>
                <td style="width: 130px;">
                    <div class="qr-section">
                        <div class="qr-wrapper">
                            {!! $qrCode !!}
                        </div>
                        <div class="qr-label">QR로 진위 확인</div>
                    </div>
                </td>
                <td></td>
                <td style="width: 200px; text-align: center;">
                    <div class="issuer-section">
                        <div class="issuer-name">zslab Academy</div>
                        <div class="issuer-title">원장</div>
                        <div class="stamp-circle">
                            <div class="stamp-text">zslab<br>Academy<br>직인</div>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- 일련번호 푸터 -->
    <div class="serial-footer">
        SERIAL: {{ $issue->serial_no }} &nbsp;|&nbsp; TOKEN: {{ $issue->verify_token }}
    </div>

</body>
</html>
