<?php

namespace App\Service;

/**
 * Maps LoL platform (e.g. BR1, NA1) to Riot API base URLs.
 * - League-v4 and Summoner-v4 use platform routing: https://{platform}.api.riotgames.com
 * - Match-v5 and Account-v1 use regional routing: americas, europe, asia, sea
 */
final class RiotRegionResolver
{
    private const PLATFORM_TO_REGION = [
        'br1' => 'americas',
        'na1' => 'americas',
        'la1' => 'americas',
        'la2' => 'americas',
        'lan1' => 'americas',
        'las1' => 'americas',
        'euw1' => 'europe',
        'eun1' => 'europe',
        'tr1' => 'europe',
        'ru' => 'europe',
        'kr' => 'asia',
        'jp1' => 'asia',
        'oc1' => 'sea',
        'ph2' => 'sea',
        'sg2' => 'sea',
        'th2' => 'sea',
        'tw2' => 'sea',
        'vn2' => 'sea',
    ];

    public static function platformToRegion(string $platform): string
    {
        $key = strtolower($platform);
        return self::PLATFORM_TO_REGION[$key] ?? 'americas';
    }

    public static function platformBaseUrl(string $platform): string
    {
        $key = strtolower($platform);
        return 'https://' . $key . '.api.riotgames.com';
    }

    public static function regionBaseUrl(string $region): string
    {
        $key = strtolower($region);
        return 'https://' . $key . '.api.riotgames.com';
    }
}
