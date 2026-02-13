<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class FrontendController extends AbstractController
{
    #[Route(
        '/{reactRouting}',
        name: 'app_frontend',
        requirements: ['reactRouting' => '^(?!api).*$'],
        priority: -1
    )]
    public function index(): Response
    {
        return new Response(
            file_get_contents($this->getParameter('kernel.project_dir') . '/public/index.html'),
            Response::HTTP_OK,
            ['Content-Type' => 'text/html']
        );
    }
}
