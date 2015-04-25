<<<<<<< HEAD:cubo.js
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
	view = mat4.lookAt([],[10, 10,-50],[1, 3, 0],[0,1,0]);
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
 *Função que cria um cubo na posição, com a cor e o tamanho passado. 
 */
function controiCubinho(cores, tamanho)
{
	var posicaoInicial = [(tamanho*-.5), tamanho*1.5, (tamanho*-.5)];
	//var posicaoInicial = [0, 0, 0];

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
		cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], //cima
		cores[1], cores[1], cores[1], cores[1], cores[1], cores[1], //tras
		cores[2], cores[2], cores[2], cores[2], cores[2], cores[2], //frente
		cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], //esquerda
		cores[4], cores[4], cores[4], cores[4], cores[4], cores[4], //baixo
		cores[5], cores[5], cores[5], cores[5], cores[5], cores[5] //direita
	];
	
	return 	{
		"points": new Float32Array(flatten(faces)),
		"colors": new Float32Array(flatten(colors)),
		"model": mat4.create(),
		"eixoRotacaoLinha": [0, 1, 0],
		"eixoRotacaoColuna": [1, 0, 0],
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
 *Controi os cubinhos e forma a matrizCubo. 
 */
function controiCubao()
{
	var tamanhoCubo = 2; //TAMANHO DAS FACES DO CUBO
	var tamanhoCubao = tamanhoCubo * 2;
	var espacamento = 0.02;
	var posicaoInicialCubo = [0.5, .5, 0]; //PONTO SUPERIOR ESQUERDO DO NOVO CUBO
	var coresCubo = controiCoresCubo(); //SEIS CORES DO CUBIBNHO
	var corCubinho = [coresCubo[4], coresCubo[1], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[3]];
	faceMostra = 0;
	data = new Array();
	
	cubo = {
		"matriz": [],
	};

	modelLinha = mat4.create();
	
	//controi matriz de 3 dimencoes para o cubo
	for(var i=0; i<3; i++) 
	{
	    cubo.matriz[i] = [];
    
        for(var j=0; j<3; j++) 
	    {
        	cubo.matriz[i][j] = [];
    	}
	}
	
	//Cria o cubo
	for (var linhas = 0; linhas < 3; linhas++)
	{
		for (var colunas = 0; colunas < 3; colunas++)
		{
			for (var profundidade = 0; profundidade < 3; profundidade++)
			{
				cubo.matriz[colunas][linhas][profundidade] = controiCubinho(coresCubo, tamanhoCubo);
				cubo.matriz[colunas][linhas][profundidade].model = mat4.translate([], modelLinha, [-tamanhoCubo * colunas, tamanhoCubo * linhas, -tamanhoCubo * profundidade]);
			}
		}
	}
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
		
		//ROXO
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
	if (e.clientY <= (canvas.height/2))
	{
		linha = 2;
	}
	//se esta a no centro
	else if (e.clientY <= (canvas.height/4)*3)
	{
		linha = 1;
	}
	//se esta abaixo
	else if (e.clientY <= (canvas.height))
	{
		linha = 0;
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
			rotacionaLinha(linha, -1); //esquerda
		else
			rotacionaLinha(linha, 1); //direita
	}
	else if (botao == 1)
	{
		if (linha <= 1)
			rotacionaColuna(coluna, -1); //baixo
		else
			rotacionaColuna(coluna, 1); //cima
	}
}

eixosRotacaoLinha = [[0, 1, 0], [], [], []];
eixosRotacaoColuna = [[], [], [], []];

/**
 *Funcao que rotacioona a matriz formada pelos cubinhos da linha parametrizada. 
 */
function rotacionaLinha(linhaRotacionar, sentidoRotacao)
{
	matrizRotacionar = [];
	
	//controi a matriz com a linha que vamos transpor
	for (var i = 0; i < 3; i++)
		matrizRotacionar = matrizRotacionar.concat(cubo.matriz[i][linhaRotacionar]); //pega a matriz de 3 posicoes de todas as colunas na linha
	
	//pega a matriz transposta
	for (var i = 0; i < 4; i++)
		matrizRotacionar = mat3.transpose([], matrizRotacionar);
	
	for (var i = 0; i < matrizRotacionar.length; i++)
	{
		//se é o cubo central, que não existe, passa para o proximo
		if (linhaRotacionar == 1 && i == 4)
			continue;

		matrizRotacionar[i].model = mat4.rotate([], matrizRotacionar[i].model, ((90 * sentidoRotacao) * Math.PI) / 180, matrizRotacionar[i].eixoRotacaoLinha);//matrizRotacionar[i].eixoRotacaoLinha);

		//se o eixo de rotação era o X para rotacionar coluna, agora vira o Z, porque o que era coluna vira linha
		if (matrizRotacionar[i].eixoRotacaoColuna[0] == 1)
			matrizRotacionar[i].eixoRotacaoColuna = [0, 0, -1];
		//senao, volta pro padrão
		else
			matrizRotacionar[i].eixoRotacaoColuna = [1, 0, 0];
	}
	
	cubo.matriz[0][linhaRotacionar] = matrizRotacionar.slice(0, 3);
	cubo.matriz[1][linhaRotacionar] = matrizRotacionar.slice(3, 6);
	cubo.matriz[2][linhaRotacionar] = matrizRotacionar.slice(6, 9);
}

/**
 *Funcao que rotaciona a matriz formada pelos cubinhos da coluna parametrizada. 
 */
function rotacionaColuna(colunaRotacionar, sentidoRotacao)
{
	matrizRotacionar = [];
	
	//controi a matriz com a linha que vamos transpor
	for (var i = 0; i < 3; i++)
		matrizRotacionar = matrizRotacionar.concat(cubo.matriz[colunaRotacionar][i]); //pega a matriz de 3 posicoes de todas as colunas na linha
	
	//pega a matriz transposta
	for (var i = 0; i < 4; i++)
		matrizRotacionar = mat3.transpose([], matrizRotacionar);
	
	for (var i = 0; i < matrizRotacionar.length; i++)
	{
		//se é o cubo central, que não existe, passa para o proximo
		if (colunaRotacionar == 1 && i == 4)
			continue;
		
		matrizRotacionar[i].model = mat4.rotate([], matrizRotacionar[i].model, ((90 * sentidoRotacao) * Math.PI) / 180, matrizRotacionar[i].eixoRotacaoColuna);//matrizRotacionar[i].eixoRotacaoColuna);

		//se o eixo de rotação era o Y para rotacionar coluna, agora vira o Z, porque o que era coluna vira linha
		if (matrizRotacionar[i].eixoRotacaoLinha[1] == 1)
			matrizRotacionar[i].eixoRotacaoLinha = [0, 0, -1];
		//senao, volta pro padrão
		else
			matrizRotacionar[i].eixoRotacaoLinha = [0, 1, 0];
	}
	
	cubo.matriz[colunaRotacionar][0] = matrizRotacionar.slice(0, 3);
	cubo.matriz[colunaRotacionar][1] = matrizRotacionar.slice(3, 6);
	cubo.matriz[colunaRotacionar][2] = matrizRotacionar.slice(6, 9);
}

/**
 * funcao que desenha na tela todos os cubinhos para formar o cubo. 
 */
function draw()
{
	if (!camera) 
		camera = [10, 10, -20];
		
	//para cada cubo
	for (var x = 0; x < cubo.matriz.length; x++)
	{
		for (var y = 0; y < cubo.matriz[x].length; y++)
		{
			for (var z = 0; z < cubo.matriz[x][y].length; z++)
			{
				if (z == 1 && x == 1 && y == 1)
					continue;
				
				gl.uniformMatrix4fv(modelLocation, false, new Float32Array(cubo.matriz[x][y][z].model));
			
				//ATRIBUTOS DOS SHADERS
				positionAttr = gl.getAttribLocation(shaderProgram, "position");
				positionBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, cubo.matriz[x][y][z].points, gl.STATIC_DRAW);
				gl.enableVertexAttribArray(positionAttr);
				gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);
				
				colorAttr = gl.getAttribLocation(shaderProgram, "color");
				colorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, cubo.matriz[x][y][z].colors, gl.STATIC_DRAW);
				gl.enableVertexAttribArray(colorAttr);
				gl.vertexAttribPointer(colorAttr, 4, gl.FLOAT, false, 0, 0);
						
				gl.drawArrays(gl.TRIANGLES, 0, cubo.matriz[x][y][z].points.length/3);
			}
		}
	}
	
	requestAnimationFrame(draw);
=======
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
	view = mat4.lookAt([],[10, 10,-50],[-3, 1.5, 0],[0,1,0]);
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
 *Função que cria um cubo na posição, com a cor e o tamanho passado. 
 */
function controiCubinho(cores, tamanho)
{
	var posicaoInicial = [-tamanho/2, tamanho/2, -tamanho/2];
	//var posicaoInicial = [0, 0, 0];

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
		cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], //cima
		cores[1], cores[1], cores[1], cores[1], cores[1], cores[1], //tras
		cores[2], cores[2], cores[2], cores[2], cores[2], cores[2], //frente
		cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], //esquerda
		cores[4], cores[4], cores[4], cores[4], cores[4], cores[4], //baixo
		cores[5], cores[5], cores[5], cores[5], cores[5], cores[5] //direita
	];
	
	return 	{
		"points": new Float32Array(flatten(faces)),
		"colors": new Float32Array(flatten(colors)),
		"model": mat4.create(),
		"eixoRotacaoLinha": [0, 1, 0],
		"eixoRotacaoColuna": [1, 0, 0],
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
 *Controi os cubinhos e forma a matrizCubo. 
 */
function controiCubao()
{
	var tamanhoCubo = 2; //TAMANHO DAS FACES DO CUBO
	var tamanhoCubao = tamanhoCubo * 2;
	var espacamento = 0.02;
	var posicaoInicialCubo = [0.5, .5, 0]; //PONTO SUPERIOR ESQUERDO DO NOVO CUBO
	var coresCubo = controiCoresCubo(); //SEIS CORES DO CUBIBNHO
	var corCubinho = [coresCubo[4], coresCubo[1], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[3]];
	faceMostra = 0;
	data = new Array();
	
	cubo = {
		"matriz": [],
	};

	modelLinha = mat4.create();
	
	//controi matriz de 3 dimencoes para o cubo
	for(var i=0; i<3; i++) 
	{
	    cubo.matriz[i] = [];
    
        for(var j=0; j<3; j++) 
	    {
        	cubo.matriz[i][j] = [];
    	}
	}
	
	//Cria o cubo
	for (var linhas = 0; linhas < 3; linhas++)
	{
		for (var colunas = 0; colunas < 3; colunas++)
		{
			for (var profundidade = 0; profundidade < 3; profundidade++)
			{
				cubo.matriz[colunas][linhas][profundidade] = controiCubinho(coresCubo, tamanhoCubo);
				cubo.matriz[colunas][linhas][profundidade].model = mat4.translate([], modelLinha, [-tamanhoCubo * colunas, tamanhoCubo * linhas, -tamanhoCubo * profundidade]);
			}
		}
	}
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
		
		//ROXO
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
	if (e.clientY <= (canvas.height/2))
	{
		linha = 2;
	}
	//se esta a no centro
	else if (e.clientY <= (canvas.height/4)*3)
	{
		linha = 1;
	}
	//se esta abaixo
	else if (e.clientY <= (canvas.height))
	{
		linha = 0;
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
			rotacionaLinha(linha, -1); //baixo
		else
			rotacionaLinha(linha, 1); //cima
	}
	else if (botao == 1)
	{
		if (linha <= 1)
			rotacionaColuna(coluna, 1); //esquerda
		else
			rotacionaColuna(coluna, -1); //direita
	}
}

eixosRotacaoLinha = [[0, 1, 0], [], [], []];
eixosRotacaoColuna = [[], [], [], []];

/**
 *Funcao que rotacioona a matriz formada pelos cubinhos da linha parametrizada. 
 */
function rotacionaLinha(linhaRotacionar, sentidoRotacao)
{
	matrizRotacionar = [];
	
	//controi a matriz com a linha que vamos transpor
	for (var i = 0; i < 3; i++)
		matrizRotacionar = matrizRotacionar.concat(cubo.matriz[i][linhaRotacionar]); //pega a matriz de 3 posicoes de todas as colunas na linha
	
	//pega a matriz transposta
	for (var i = 0; i < 4; i++)
		matrizRotacionar = mat3.transpose([], matrizRotacionar);
	
	for (var i = 0; i < matrizRotacionar.length; i++)
	{
		//se é o cubo central, que não existe, passa para o proximo
		if (linhaRotacionar == 1 && i == 4)
			continue;

		
		//se o eixo de rotação era o X para rotacionar coluna, agora vira o Z, porque o que era coluna vira linha
		if (matrizRotacionar[i].eixoRotacaoColuna == [-1, 0, 0])
			matrizRotacionar[i].eixoRotacaoColuna = [0, 0, -1];
		//senao, volta pro padrão
		else
			matrizRotacionar[i].eixoRotacaoColuna = [1, 0, 0];
		

		matrizRotacionar[i].model = mat4.rotate([], matrizRotacionar[i].model, ((90 * sentidoRotacao) * Math.PI) / 180, matrizRotacionar[i].eixoRotacaoLinha);
	}
	
	cubo.matriz[0][linhaRotacionar] = matrizRotacionar.slice(0, 3);
	cubo.matriz[1][linhaRotacionar] = matrizRotacionar.slice(3, 6);
	cubo.matriz[2][linhaRotacionar] = matrizRotacionar.slice(6, 9);
}

/**
 *Funcao que rotaciona a matriz formada pelos cubinhos da coluna parametrizada. 
 */
function rotacionaColuna(colunaRotacionar, sentidoRotacao)
{
	matrizRotacionar = [];
	
	//controi a matriz com a linha que vamos transpor
	for (var i = 0; i < 3; i++)
		matrizRotacionar = matrizRotacionar.concat(cubo.matriz[colunaRotacionar][i]); //pega a matriz de 3 posicoes de todas as colunas na linha
	
	//pega a matriz transposta
	for (var i = 0; i < 4; i++)
		matrizRotacionar = mat3.transpose([], matrizRotacionar);
	
	for (var i = 0; i < matrizRotacionar.length; i++)
	{
		//se é o cubo central, que não existe, passa para o proximo
		if (colunaRotacionar == 1 && i == 4)
			continue;

		/*
		//se o eixo de rotação era o Y para rotacionar coluna, agora vira o Z, porque o que era coluna vira linha
		if (matrizRotacionar[i].eixoRotacaoLinha == [0, 1, 0])
			matrizRotacionar[i].eixoRotacaoColuna = [0, 0, 1];
		//senao, volta pro padrão
		else
			matrizRotacionar[i].eixoRotacaoColuna = [0, 1, 0];
		*/

		matrizRotacionar[i].model = mat4.rotate([], matrizRotacionar[i].model, ((90 * sentidoRotacao) * Math.PI) / 180, matrizRotacionar[i].eixoRotacaoColuna);
	}
	
	cubo.matriz[colunaRotacionar][0] = matrizRotacionar.slice(0, 3);
	cubo.matriz[colunaRotacionar][1] = matrizRotacionar.slice(3, 6);
	cubo.matriz[colunaRotacionar][2] = matrizRotacionar.slice(6, 9);
}

/**
 * funcao que desenha na tela todos os cubinhos para formar o cubo. 
 */
function draw()
{
	if (!camera) 
		camera = [10, 10, -20];
		
	//para cada cubo
	for (var x = 0; x < cubo.matriz.length; x++)
	{
		for (var y = 0; y < cubo.matriz[x].length; y++)
		{
			for (var z = 0; z < cubo.matriz[x][y].length; z++)
			{
				if (z == 1 && x == 1 && y == 1)
					continue;
				
				gl.uniformMatrix4fv(modelLocation, false, new Float32Array(cubo.matriz[x][y][z].model));
			
				//ATRIBUTOS DOS SHADERS
				positionAttr = gl.getAttribLocation(shaderProgram, "position");
				positionBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, cubo.matriz[x][y][z].points, gl.STATIC_DRAW);
				gl.enableVertexAttribArray(positionAttr);
				gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);
				
				colorAttr = gl.getAttribLocation(shaderProgram, "color");
				colorBuffer = gl.createBuffer();
				gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, cubo.matriz[x][y][z].colors, gl.STATIC_DRAW);
				gl.enableVertexAttribArray(colorAttr);
				gl.vertexAttribPointer(colorAttr, 4, gl.FLOAT, false, 0, 0);
						
				gl.drawArrays(gl.TRIANGLES, 0, cubo.matriz[x][y][z].points.length/3);
			}
		}
	}
	
	requestAnimationFrame(draw);
>>>>>>> parent of ba92bd0... Ajustar rotação dos cubos. Girando quase perfeitamente. Faltando ajustar a direção do vetor Z ao girar colunas e linhas.:aula03.js
}