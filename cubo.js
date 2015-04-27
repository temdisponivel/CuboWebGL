var	vertexShaderSource, 
	fragmentShaderSource,
	vertexShader,
	fragmentShader,
	shaderProgram,
	canvas,
	gl,
	matrizCubo,
	face;

//Atributos para o vertex
var positionBuffer,
	colorBuffer,
	positionAttr,
	colorAttr;

//Matrizes de model, view e projection	
var model,
	modelLocation,
	view, 
	viewLocation,
	projection,
	projectionLocation;

//PosiÃ§Ã£o onde estÃ¡ a cÃ¢mera - ponto num espaÃ§o com um vetor indicando onde Ã© "para cima" epara onde ela aponta
var camera;

window.addEventListener("SHADERS_LOADED", main);
loadFile("vertex.glsl","VERTEX",loadShader);
loadFile("fragment.glsl","FRAGMENT",loadShader);

var modelo = 
{
	"model":mat4.create()
}

function loadFile(filename, type, callback)
{
	var xhr = new XMLHttpRequest();
	xhr.open("GET",filename,true);
	xhr.onload = function(){callback(xhr.responseText,type)};
	xhr.send();
}

function getGLContext()
{
	canvas = document.getElementById("canvas");
	gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.enable(gl.DEPTH_TEST);
}

function loadShader (text,type)
{
	if(type == "VERTEX") vertexShaderSource = text;
	if(type == "FRAGMENT") fragmentShaderSource = text;
	if(vertexShaderSource && fragmentShaderSource) window.dispatchEvent(new Event("SHADERS_LOADED"));
}

function compileShader (source,type)
{
	shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) console.log(gl.getShaderInfoLog(shader));
	return shader;
}

function linkProgram (vertexShader,fragmentShader)
{
	var program	= gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) console.log("Error: Program Linking.");
	return program;
}

/**
 *Função que cria um cubo na posição, com a cor e o tamanho passado. 
 */
function cubo(cores, tamanho)
{
	var posicaoInicial = [0, 0, 0];

	var pontos = 
	[		
		[posicaoInicial[0], posicaoInicial[1], posicaoInicial[2]], //superior esquerdo
		[posicaoInicial[0] + tamanho, posicaoInicial[1], posicaoInicial[2]], //superior direito
				
		[posicaoInicial[0] + tamanho, posicaoInicial[1], posicaoInicial[2] + tamanho], //superior direito fundo
		[posicaoInicial[0], posicaoInicial[1], posicaoInicial[2] + tamanho], //superior esquerdo fundo
		
		[posicaoInicial[0], (posicaoInicial[1] - tamanho), posicaoInicial[2]], //inferior esquerdo
		[posicaoInicial[0] + tamanho, (posicaoInicial[1] - tamanho), posicaoInicial[2]], //inferior direito
		
		[posicaoInicial[0] + tamanho, (posicaoInicial[1] - tamanho), posicaoInicial[2] + tamanho], //inferior direito fundo
		[posicaoInicial[0], (posicaoInicial[1] - tamanho), posicaoInicial[2] + tamanho] //inferior esquerdo fundo
	];
	var faces = 
	[
		pontos[0], pontos[1], pontos[2],
		pontos[0], pontos[2], pontos[3],
		
		pontos[0], pontos[3], pontos[4],
		pontos[3], pontos[4], pontos[7],
		
		pontos[0], pontos[1], pontos[4],
		pontos[1], pontos[4], pontos[5],
		
		pontos[1], pontos[2], pontos[5],
		pontos[2], pontos[5], pontos[6],
		
		pontos[4], pontos[5], pontos[6],
		pontos[4], pontos[6], pontos[7],
		
		pontos[2], pontos[3], pontos[6],
		pontos[3], pontos[6], pontos[7]
	];
	
	var colors = 
	[
		cores[0], cores[0], cores[0], cores[0], cores[0], cores[0],
		cores[1], cores[1], cores[1], cores[1], cores[1], cores[1],
		cores[2], cores[2], cores[2], cores[2], cores[2], cores[2],
		cores[3], cores[3], cores[3], cores[3], cores[3], cores[3],
		cores[4], cores[4], cores[4], cores[4], cores[4], cores[4],
		cores[5], cores[5], cores[5], cores[5], cores[5], cores[5]
	];
	
	return 	{
		"points": new Float32Array(flatten(faces)),
		"colors": new Float32Array(flatten(colors)),
		"model": mat4.create(),
	};
}

function flatten(nested){
	var flat = [];
	
	for (var i = 0; i < nested.length; i++)
	{
		flat = flat.concat(nested[i]);
	}
	
	return flat;
}

/**
 *função que carrega  os shadders e o cubo.
 */
function main() 
{
	/* LOAD GL */
	getGLContext();
	
	/* COMPILE AND LINK */
	vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
	fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
	shaderProgram = linkProgram(vertexShader,fragmentShader);
	gl.useProgram(shaderProgram);
	
	//Cria matriz identidade 4x4
	model = mat4.create();
	modelLocation = gl.getUniformLocation(shaderProgram, "model");
	gl.uniformMatrix4fv(modelLocation, false, new Float32Array(model));
	
	//cÃ¢mera  //pra onde olha  //onde Ã© para cima
	view = mat4.lookAt([],[10,10,-50],[1,0,0],[0,1,0]);
	viewLocation = gl.getUniformLocation(shaderProgram,"view");
	gl.uniformMatrix4fv(viewLocation, false, new Float32Array(view));
	
	//50: angulo de visao   //proporÃ§Ã£o da tela   //campo de visÃ£o - mais perto e mais longe
	projection = mat4.perspective([], -50, canvas.width/canvas.height, 0.1, 100);
	projectionLocation = gl.getUniformLocation(shaderProgram, "projection");
	gl.uniformMatrix4fv(projectionLocation, false, new Float32Array(projection));
	
	face = 0; //face a mostra do cubo: 0 - frente 1 - direita 2 - tras 3 - esquerda 4 - cima 5 - baixo
	
	controiCubao();
	
	draw();
	
	window.addEventListener("click", click);
	window.addEventListener("keypress", tecla);
}

/**
 *Controi os cubinhos e forma a matrizCubo. 
 */
function controiCubao()
{
	var tamanhoCubo = 2; //TAMANHO DAS FACES DO CUBO
	var tamanhoCubao = tamanhoCubo * 2;
	var espacamento = 0.03;
	var posicaoInicialCubo = [0, 0, 0]; //PONTO SUPERIOR ESQUERDO DO NOVO CUBO
	var coresCubo = controiCoresCubo(); //SEIS CORES DO CUBIBNHO
	faceMostra = 0;
	data = new Array();
	matrizCubo = [];
	
	//controi matriz de 3 dimencoes para o cubo
	for(var i=0; i<3; i++) 
	{
	    matrizCubo[i] = [];
    
        for(var j=0; j<3; j++) 
	    {
        	matrizCubo[i][j] = [];
    	}
	}
	
	//CONTROI OS SEIS CUBOS DO CENTRO
	
	//FRENTE
	matrizCubo[1][1][0] = cubo([coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	//FUNDO
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[1][1][2] = cubo([coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	//ESQUERDA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[0][1][1] = cubo([coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	//DIREITA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[2][1][1] = cubo([coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	//CIMA
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[1][0][1] = cubo([coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	//BAIXO
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[1][2][1] = cubo([coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//CONTROI OS 12 CUBOS DOS CANTOS DUPLOS
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//ESQUERDA DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	matrizCubo[0][1][0] = cubo([coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//DIREITA DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	matrizCubo[2][1][0] = cubo([coresCubo[5], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//CIMA DA FRENTE
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	matrizCubo[1][0][0] = cubo([coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//BAIXO DA FRENTE
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	matrizCubo[1][2][0] = cubo([coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//ESQUERDA DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[0][1][2] = cubo([coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	
	//DIREITA DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[2][1][2] = cubo([coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	
	//CIMA DA TRAS
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[1][0][2] = cubo([coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	
	//BAIXO DA TRAS
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[1][2][2] = cubo([coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	
	//BAIXO DA ESQUERDA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[0][2][1] = cubo([coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//CIMA DA ESQUERDA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[0][0][1] = cubo([coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//BAIXO DA DIREITA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[2][2][1] = cubo([coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//CIMA DA DIREITA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	matrizCubo[2][0][1] = cubo([coresCubo[4], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	//CONTRÓI OS 8 CUBOS COM CANTOS TRIPLHOS
	
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//ESQUERDA SUPERIOR DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	matrizCubo[0][0][0] = cubo([coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//DIREITA SUPERIOR DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	matrizCubo[2][0][0] = cubo([coresCubo[4], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//ESQUERDA INFERIOR DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	matrizCubo[0][2][0] = cubo([coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	
	//DIREITA INFERIOR DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	matrizCubo[2][2][0] = cubo([coresCubo[5], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo);
	
	//ESQUERDA SUPERIOR DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[0][0][2] = cubo([coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	
	//DIREITA SUPERIOR DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[2][0][2] = cubo([coresCubo[4], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	
	//ESQUERDA INFERIOR DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[0][2][2] = cubo([coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo);
	
	
	//DIREITA INFERIOR DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	matrizCubo[2][2][2] = cubo([coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo);
}

/**
 *Cria as cores usadas nos cubos. 
 */
function controiCoresCubo()
{
	var cores = 
	[
		//VERMELHO
		[1, 0, 0, 1],
		
		//AZUL
		[0, 0, 1, 1],
		
		//VERDE
		[0, 1, 0, 1],
		
		//AMARELO
		[1, 0, 1, 1],
		
		//AZUL ESTRANHO
		[0, 1, 1, 1],
		
		//PRETO
		[0, 0, 0, 1],
	];
	
	return cores;
}

function tecla(e)
{
	//0 - frente 1 - direita 2 - tras 3 - esquerda 4 - cima 5 - baixo
	
	if (e.keyCode == 37) //seta esquerda
	{
		//se esta mostrando a face de cima ou de baixo
		if (face == 4 || face == 5)
		{
			face = 3;
		}
		//se esta mostrando qualquer outra
		else 
		{
			face--;
			
			if (face == -1)
			{
				face = 3;
			}
		}
	}
	else if (e.keyCode == 38) //seta cima
	{
		//se nao esta nem em cima nem em baixo
		if (face != 4 && face != 5)
		{
			face = 4;
		}
		else
		{
			if (face == 4)
			{
				face = 2;
			}
			else
			{
				face = 0;
			}
		}
	}
	else if (e.keyCode == 39) //se direita
	{
		//se esta mostrando a face de cima ou de baixo
		if (face == 4 || face == 5)
		{
			face = 1;
		}
		//se esta mostrando qualquer outra
		else 
		{
			face++;
			
			if (face == 4)
			{
				face = 0;
			}
		}
	}
	else if (e.keyCode == 40) //seta baixo
	{
		//se nao esta nem em cima nem em baixo
		if (face != 4 && face != 5)
		{
			face = 4;
		}
		else
		{
			if (face == 4)
			{
				face = 0;
			}
			else
			{
				face = 2;
			}
		}
	}
}

function gira(lado)
{
	
}

/**
 *Funcao click do botão. Calcula o quadrante clicado. 
 */
function click(e) 
{
	botao = e.button;
	
	//se este a esquerda
	if (e.clientX <= (canvas.width/2))
	{
		coluna = 0;
	}
	//se este no centro
	else if (e.clientX <= (canvas.width/4)*3)
	{
		coluna = 1;
	}
	//se esta a direita
	else if (e.clientX <= (canvas.width))
	{
		coluna = 2;
	}
	
	//se esta acima
	if (e.clientY <= (canvas.width/2))
	{
		linha = 0;
	}
	//se esta a no centro
	else if (e.clientY <= (canvas.width/4)*3)
	{
		linha = 1;
	}
	//se esta abaixo
	else if (e.clientY <= (canvas.height))
	{
		linha = 2;
	}
	
	rotacoes();
}

/**
 *Funcao que gerencia as rotacoes. 
 */
function rotacoes()
{
	//se apertou o mouse
	if (botao == 0)
	{
		if (coluna <= 1)
			rotacionaLinha(linha, -1);
		else
			rotacionaLinha(linha, 1);
	}
	else if (botao == 1)
	{
		if (linha <= 1)
			rotacionaColuna(coluna, -1);
		else
			rotacionaColuna(coluna, 1);
	}
}

/**
 *Funcao que rotacioona a matriz formada pelos cubinhos da linha parametrizada. 
 */
function rotacionaLinha(linhaRotacionar, sentidoRotacao)
{
	matrizRotacionar = [];
	
	//controi a matriz com a linha que vamos transpor
	for (var i = 0; i < 3; i++)
		matrizRotacionar = matrizRotacionar.concat(matrizCubo[i][linhaRotacionar]); //pega a matriz de 3 posicoes de todas as colunas na linha
	
	//pega a matriz transposta
	matrizRotacionar = mat3.transpose([], matrizRotacionar);
	
	for (var i = 0; i < matrizRotacionar.length; i++)
	{
		matrizRotacionar[i].model = mat4.rotate([], matrizRotacionar[i].model, (90 * Math.PI) / 180, [0, 1, 0]);
		matrizRotacionar[i].model = mat4.translate([], matrizRotacionar[i].model, [-4, 0, 0]);
	}
	
	matrizCubo[0][linhaRotacionar] = matrizRotacionar.slice(0, 3);
	matrizCubo[1][linhaRotacionar] = matrizRotacionar.slice(3, 6);
	matrizCubo[2][linhaRotacionar] = matrizRotacionar.slice(6, 9);
}

/**
 *Funcao que rotaciona a matriz formada pelos cubinhos da coluna parametrizada. 
 */
function rotacionaColuna(colunaRotacionar, sentidoRotacao)
{
	matrizRotacionar = [];
	
	//controi a matriz com a linha que vamos transpor
	for (var i = 0; i < 3; i++)
		matrizRotacionar = matrizRotacionar.concat(matrizCubo[colunaRotacionar][i]); //pega a matriz de 3 posicoes de todas as colunas na linha
	
	//pega a matriz transposta
	matrizRotacionar = mat3.transpose([], matrizRotacionar);
	
	for (var i = 0; i < matrizRotacionar.length; i++)
	{
		matrizRotacionar[i].model = mat4.rotate([], matrizRotacionar[i].model, (90 * Math.PI) / 180, [1, 0, 0]);
		matrizRotacionar[i].model = mat4.translate([], matrizRotacionar[i].model, [-4, 0, 0]);
	}
	
	matrizCubo[colunaRotacionar][0] = matrizRotacionar.slice(0, 3);
	matrizCubo[colunaRotacionar][1] = matrizRotacionar.slice(3, 6);
	matrizCubo[colunaRotacionar][2] = matrizRotacionar.slice(6, 9);
}

/**
 * funcao que desenha na tela todos os cubinhos para formar o cubo. 
 */
function draw()
{
	if (!camera) 
		camera = [10, 10, -20];
		
	//para cada cubo
	for (var x = 0; x < matrizCubo.length; x++)
	{
		for (var y = 0; y < matrizCubo[x].length; y++)
		{
			for (var z = 0; z < matrizCubo[x][y].length; z++)
			{
				if (z == 1 && x == 1 && y == 1)
					continue;
				
				gl.uniformMatrix4fv(modelLocation, false, new Float32Array(matrizCubo[x][y][z].model));
			
				//ATRIBUTOS DOS SHADERS
				positionAttr = gl.getAttribLocation(shaderProgram, "position");
				positionBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, matrizCubo[x][y][z].points, gl.STATIC_DRAW);
				gl.enableVertexAttribArray(positionAttr);
				gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);
				
				colorAttr = gl.getAttribLocation(shaderProgram, "color");
				colorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, matrizCubo[x][y][z].colors, gl.STATIC_DRAW);
				gl.enableVertexAttribArray(colorAttr);
				gl.vertexAttribPointer(colorAttr, 4, gl.FLOAT, false, 0, 0);
						
				gl.drawArrays(gl.TRIANGLES, 0, matrizCubo[x][y][z].points.length/3);
			}
		}
	}
	
	requestAnimationFrame(draw);
}