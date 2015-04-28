var	vertexShaderSource, 
	fragmentShaderSource,
	vertexShader,
	fragmentShader,
	shaderProgram,
	canvas,
	gl,
	teclas = [],
	cubos = [];

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

function flatten(nested){
	var flat = [];
	
	for (var i = 0; i < nested.length; i++)
	{
		flat = flat.concat(nested[i]);
	}
	
	return flat;
}

function main() 
{
	/* LOAD GL */
	getGLContext();
	
	/* COMPILE AND LINK */
	vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
	fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
	shaderProgram = linkProgram(vertexShader,fragmentShader);
	gl.useProgram(shaderProgram);
	
	pressionado = false;
	
	//Cria matriz identidade 4x4
	model = mat4.create();
	modelLocation = gl.getUniformLocation(shaderProgram, "model");
	gl.uniformMatrix4fv(modelLocation, false, new Float32Array(model));
	
	//cÃ¢mera  //pra onde olha  //onde Ã© para cima
	view = mat4.lookAt([],[10,10,-50],[0,0,0],[0,1,0]);
	viewLocation = gl.getUniformLocation(shaderProgram,"view");
	gl.uniformMatrix4fv(viewLocation, false, new Float32Array(view));
	
	//50: angulo de visao   //proporÃ§Ã£o da tela   //campo de visÃ£o - mais perto e mais longe
	projection = mat4.perspective([], -50, canvas.width/canvas.height, 0.1, -1000);
	projectionLocation = gl.getUniformLocation(shaderProgram, "projection");
	gl.uniformMatrix4fv(projectionLocation, false, new Float32Array(projection));
	
	controiCena(9);
	
	gl.clearColor(0, 0, 0, 1);

	draw();
	
	window.addEventListener("keydown", teclaPresionada)
	window.addEventListener("keyup", teclaSolta)
}

function controiCubinho(cores, tamanho, posicaoInicial, velocidade)
{

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
		"velocidade": velocidade,
	};
}

/**
 *Controi os cubinhos e forma a matrizCubo. 
 */
function controiCubao(coresCubo, velocidade, tamanho, posicao, quantidade)
{
	var tamanhoCubo = tamanho; //TAMANHO DAS FACES DO CUBO
	var posicaoInicialCubo = posicao; //PONTO SUPERIOR ESQUERDO DO NOVO CUBO
	var espacamento = tamanho/100 * 40;
	
	cubo = {
		"matriz": [],
	};
	
	//controi matriz de 3 dimencoes para o cubo
	for(var i=0; i<quantidade; i++) 
	{
	    cubo.matriz[i] = [];
    
        for(var j=0; j<quantidade; j++) 
	    {
        	cubo.matriz[i][j] = [];
    	}
	}
	
	for (var linhas = 0; linhas < quantidade; linhas++)
	{
		for (var colunas = 0; colunas < quantidade; colunas++)
		{
			for (var profundidade = 0; profundidade < quantidade; profundidade++)
			{
				cubo.matriz[colunas][linhas][profundidade] = controiCubinho(coresCubo, tamanhoCubo-espacamento, [posicaoInicialCubo[0]-tamanhoCubo * colunas, posicaoInicialCubo[1]+tamanhoCubo * linhas, posicaoInicialCubo[2]-tamanhoCubo * profundidade], velocidade);
			}
		}
	}

	return cubo;
}

function controiCena(quantidade)
{
	var cores = controiCoresCubo(); //SEIS CORES DO CUBIBNHO

	//SOL
	cubos[0] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[1] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);

	/*	
	//MERCURIO
	cubos[2] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[3] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);

	//VENUS
	cubos[4] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[5] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);
	*/
	//TERRA
	cubos[2] = controiCubao([cores[1], cores[1], cores[1], cores[1], cores[1], cores[1], cores[1]], 7, .7, [7 + (.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);
	cubos[3] = controiCubao([cores[2], cores[2], cores[2], cores[2], cores[2], cores[2], cores[2]], 7, .7, [7 + (.7*3)/2.5, -(.7*3)/2.5, (.7*3)/2.5], 3);
	//LUA
	cubos[4] = controiCubao([cores[5], cores[5], cores[5], cores[5], cores[5], cores[5], cores[5]], 7, .7, [2 + 7 + (.7*2)/2.5, 1 -(.7*2)/2.5, (.7*2)/2.5], 2);
	cubos[5] = controiCubao([cores[4], cores[4], cores[4], cores[4], cores[4], cores[4], cores[4]], 7, .7, [2 + 7 + (.7*1)/2.5, 1 -(.7*1)/2.5, (.7*1)/2.5], 1);
	/*
	//MARTE
	cubos[10] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[11] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);

	//JUPITER
	cubos[12] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[13] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);

	//SATURNO
	cubos[14] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[15] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);

	//URANO
	cubos[16] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[17] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);

	//NETURNO
	cubos[18] = controiCubao([cores[3], cores[3], cores[3], cores[3], cores[3], cores[3], cores[3]], 2, .7, [(.7*6)/2.5, -(.7*6)/2.5, (.7*6)/2.5], 6);
	cubos[19] = controiCubao([cores[0], cores[0], cores[0], cores[0], cores[0], cores[0], cores[0]], 2, .7, [(.7*4)/2.5, -(.7*4)/2.5, (.7*4)/2.5], 4);
	*/
	for (var i = 0; i < cubos.length; i++)
	{
		cubo = cubos[i];
		for (var x = 0; x < cubo.matriz.length; x++)
		{
			for (var y = 0; y < cubo.matriz[x].length; y++)
			{
				for (var z = 0; z < cubo.matriz[x][y].length; z++)
				{
					if (z == 1 && x == 1 && y == 1)
						continue;

					cubo.matriz[x][y][z].model = mat4.translate([], cubo.matriz[x][y][z].model, [-20, -20, 100]);
				}
			}
		}
	}
}

function controiCoresCubo()
{
	var cores = 
	[
		//VERMELHO
		[1, 0, 0, 1],
		
		//AZUL
		[0, 0, 1, 1],
		
		//VERDEMARROMZADO
		[.5, .9, .2, 1],
		
		//AMARELO
		[1, .9, 0, 1],
		
		//cinza claro
		[.8, .8, .8, 1],
		
		//cinza
		[.6, .6, .6, 1],
	];
	
	return cores;
}

var W = 0, A = 1, S = 2, D = 3, CIMA = 4, ESQUERDA = 5, DIREITA = 6, BAIXO = 7;

function teclaPresionada(e)
{
	valor = true;
	switch (e.keyCode)
	{
		//W
		case 87:
			teclas[W] = valor;
			break;
		//A
		case 65:
			teclas[A] = valor;
			break;
		//S
		case 83:
			teclas[S] = valor;
			break;
		//D
		case 68:
			teclas[D] = valor;
			break;
		//SETA CIMA
		case 38:
			teclas[CIMA] = valor;
			break;
		//SETA ESQUERDA
		case 37:
			teclas[ESQUERDA] = valor;
			break;
		//SETA DIREITA
		case 39:
			teclas[DIREITA] = valor;
			break;
		//SETA BAIXO
		case 40:
			teclas[BAIXO] = valor;
			break;
		default:
			break;
	}
}

function teclaSolta(e)
{
	valor = false;
	switch (e.keyCode)
	{
		//W
		case 87:
			teclas[W] = valor;
			break;
		//A
		case 65:
			teclas[A] = valor;
			break;
		//S
		case 83:
			teclas[S] = valor;
			break;
		//D
		case 68:
			teclas[D] = valor;
			break;
		//SETA CIMA
		case 38:
			teclas[CIMA] = valor;
			break;
		//SETA ESQUERDA
		case 37:
			teclas[ESQUERDA] = valor;
			break;
		//SETA DIREITA
		case 39:
			teclas[DIREITA] = valor;
			break;
		//SETA BAIXO
		case 40:
			teclas[BAIXO] = valor;
			break;
		default:
			break;
	}
}

function rotaciona(cuborotacionar)
{
	var direcao = 1;
	var eixo = [0, 0, 0];
	var rotacionar = false;

	if (teclas[CIMA] == true)
	{
		direcao = 1;
		eixo[0] = 1;
		rotacionar = true;
	}

	if (teclas[ESQUERDA] == true)
	{
		direcao = -1;
		eixo[1] = 1;
		rotacionar = true;
	}

	if (teclas[DIREITA] == true)
	{
		direcao = 1;
		eixo[1] = 1;
		rotacionar = true;
	}

	if (teclas[BAIXO] == true)
	{
		direcao = -1;
		eixo[0] = 1;
		rotacionar = true;
	}

	for (var x = 0; rotacionar && x < cuborotacionar.matriz.length; x++)
	{
		for (var y = 0; y < cuborotacionar.matriz[x].length; y++)
		{
			for (var z = 0; z < cuborotacionar.matriz[x][y].length; z++)
			{
				if (z == 1 && x == 1 && y == 1)
					continue;

				if (teclas[ESQUERDA] || teclas[DIREITA])
					cuborotacionar.matriz[x][y][z].model = mat4.rotate([], cuborotacionar.matriz[x][y][z].model, ((cuborotacionar.matriz[x][y][z].velocidade * direcao) * Math.PI) / 180, [0, 1, 0]);
				if (teclas[CIMA] || teclas[BAIXO])
					cuborotacionar.matriz[x][y][z].model = mat4.rotate([], cuborotacionar.matriz[x][y][z].model, ((cuborotacionar.matriz[x][y][z].velocidade * direcao) * Math.PI) / 180, [1, 0, 0]);
			}
		}
	}
}

function movimenta(cubomovimentar)
{
	var direita = 0;
	var esquerda = 0;
	var cima = 0;
	var baixo = 0;
	var velocidade = 0;
	var movimentar = false;

	if (teclas[W] == true)
	{
		cima = 1;
		movimentar = true;
	}

	if (teclas[A] == true)
	{
		esquerda = 1;
		movimentar = true;
	}

	if (teclas[D] == true)
	{
		direita = 1;
		movimentar = true;
	}

	if (teclas[S] == true)
	{
		baixo = 1;
		movimentar = true;
	}

	for (var x = 0; movimentar && x < cubomovimentar.matriz.length; x++)
	{
		for (var y = 0; y < cubomovimentar.matriz[x].length; y++)
		{
			for (var z = 0; z < cubomovimentar.matriz[x][y].length; z++)
			{
				if (z == 1 && x == 1 && y == 1)
					continue;

				velocidade = cubomovimentar.matriz[x][y][z].velocidade/100;
				cubomovimentar.matriz[x][y][z].model = mat4.translate([], cubomovimentar.matriz[x][y][z].model, [(esquerda*velocidade)-(direita*velocidade), (cima*velocidade)-(baixo*velocidade), 0]);
			}
		}
	}
}

function draw()
{
	if (!camera) 
		camera = [10, 10, -20];

	gl.clear(gl.COLOR_BUFFER_BIT);
		
	//para cada cubo
	for (var quant = 0; quant < cubos.length; quant++)
	{
		cubo = cubos[quant];

		rotaciona(cubo);
		movimenta(cubo);

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
	}
	
	requestAnimationFrame(draw);
}