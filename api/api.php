<?php
header('Content-Type: application/json');

if (!isset($_GET['number']) || empty($_GET['number'])) {
    echo json_encode([
        'error' => 'Missing number parameter',
        'developer' => '@ITZ_ME_545'
    ]);
    exit;
}

$number = $_GET['number'];
$A = 'true';

$url = 'https://api.eyecon-app.com/app/getnames.jsp';
$params = [
    'cli' => $number,
    'lang' => 'en',
    'is_callerid' => $A,
    'is_ic' => $A,
    'cv' => 'vc_672_vn_4.2025.10.17.1932_a',
    'requestApi' => 'URLconnection',
    'source' => 'MenifaFragment'
];

$headers = [
    'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'accept: application/json',
    'e-auth-v: e1',
    'e-auth: c5f7d3f2-e7b0-4b42-aac0-07746f095d38',
    'e-auth-c: 40',
    'e-auth-k: PgdtSBeR0MumR7fO',
    'accept-charset: UTF-8',
    'content-type: application/x-www-form-urlencoded; charset=utf-8',
    'Host: api.eyecon-app.com',
    'Connection: Keep-Alive'
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url . '?' . http_build_query($params),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200 || !$response) {
    echo json_encode([
        'error' => 'API request failed',
        'developer' => '@ITZ_ME_545'
    ]);
    exit;
}

$data = json_decode($response, true);

if (is_array($data)) {
    $data['developer'] = '@ITZ_ME_545';
    echo json_encode($data);
} else {
    echo json_encode([
        'raw' => $response,
        'developer' => '@ITZ_ME_545'
    ]);
}
