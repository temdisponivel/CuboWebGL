var	vertexShaderSource, 
	fragmentShaderSource,
	vertexShader,
	fragmentShader,
	shaderProgram,
	canvas,
	gl,
	teclas = [],
	data;

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

function cubo(posicaoInicial, cores, tamanho, velocidade)
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
	projection = mat4.perspective([], -50, canvas.width/canvas.height, 0.1, 100);
	projectionLocation = gl.getUniformLocation(shaderProgram, "projection");
	gl.uniformMatrix4fv(projectionLocation, false, new Float32Array(projection));
	
	controiCubao();
	
	draw();
	
	window.addEventListener("onkeydown", teclaPresionada)
	window.addEventListener("onkeyup", teclaSolta)
}

function controiCubao()
{
	var tamanhoCubo = ((document.getElementById("canvas").width / 100) * 80) / 1000; //TAMANHO DAS FACES DO CUBO
	var tamanhoCubao = tamanhoCubo * 2;
	var espacamento = 0.03;
	var posicaoInicialCubo = [0, 0, 0]; //PONTO SUPERIOR ESQUERDO DO NOVO CUBO
	var coresCubo = controiCoresCubo(); //SEIS CORES DO CUBIBNHO
	var eixoRotacao = [[0, 1, 0], [1, 0, 0]]; //OS DOIS EIXOS DE ROTACAO DO CUBO
	var velocidade = 0.5; //velicidade da rotacao
	data = new Array();
	
	//CONTROI OS SEIS CUBOS DO CENTRO
	
	//FRENTE
	data[0] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade); //parametro camada = quadrante que o cubo esta
	
	//FUNDO
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[2] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	//DIREITA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[1] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	//ESQUERDA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[3] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	//CIMA
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[4] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	//BAIXO
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[5] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//CONTROI OS 12 CUBOS DOS CANTOS DUPLOS
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//DIREITA DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	data[6] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//ESQUERDA DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	data[7] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//CIMA DA FRENTE
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	data[8] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//BAIXO DA FRENTE
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	data[9] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//DIREITA DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[10] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	
	//ESQUERDA DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[11] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	
	//CIMA DA TRAS
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[12] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	
	//BAIXO DA TRAS
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[13] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	
	//BAIXO DA DIREITA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[14] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//CIMA DA DIREITA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[15] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//BAIXO DA ESQUERDA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[16] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//CIMA DA ESQUERDA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[17] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	//CONTRÓI OS 8 CUBOS COM CANTOS TRIPLHOS
	
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//DIREITA SUPERIOR DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	data[18] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//ESQUERDA SUPERIOR DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	data[19] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//DIREITA INFERIOR DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	data[20] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	
	//ESQUERDA INFERIOR DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	data[21] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, velocidade);
	
	//DIREITA SUPERIOR DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[22] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	
	//ESQUERDA SUPERIOR DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[23] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	
	//DIREITA INFERIOR DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[24] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
	
	
	//ESQUERDA INFERIOR DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[25] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, velocidade);
}

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

function rotacoes(cubo)
{
	//percorre todos os cubinhos do cubo
	for (var i = 0; i < cubo.length; i++)
	{
		//FAZ AS ROTACOES
		data[i].model = mat4.rotate([], data[i].model, (data[i].velocidade * Math.PI) / 180, [1, 0, 0]); //rotaciona o cubo em X
		data[i].model = mat4.rotate([], data[i].model, (data[i].velocidade * Math.PI) / 180, [0, 1, 0]); //rotaciona o cubo em Y
	}
}

function movimentos(cubo)
{
	//percorre todos os cubinhos do cubo
	for (var i = 0; i < cubo.length; i++)
	{
		//FAZ AS TRANSLAÇÕES
		data[i].model = mat4.rotate([], data[i].model, (data[i].velocidade * Math.PI) / 180, [1, 0, 0]); //rotaciona o cubo em X
		data[i].model = mat4.rotate([], data[i].model, (data[i].velocidade * Math.PI) / 180, [0, 1, 0]); //rotaciona o cubo em Y
	}
}

function draw()
{
	if (!camera) 
		camera = [10, 10, -20];
		
	//para cada cubo
	for (var i = 0; i < data.length; i++)
	{
		for (var j = 0; j < data[i].length; j++)
		{
			rotacoes(data[i][j]);
			movimentos(data[i][j]);
			
			gl.uniformMatrix4fv(modelLocation, false, new Float32Array(data[i][j].model));
		
			//ATRIBUTOS DOS SHADERS
			positionAttr = gl.getAttribLocation(shaderProgram, "position");
			positionBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, data[i][j].points, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(positionAttr);
			gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);
			
			colorAttr = gl.getAttribLocation(shaderProgram, "color");
			colorBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, data[i][j].colors, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(colorAttr);
			gl.vertexAttribPointer(colorAttr, 4, gl.FLOAT, false, 0, 0);
					
			gl.drawArrays(gl.TRIANGLES, 0, data[i][j].points.length/3);
		}
	}
	
	
	requestAnimationFrame(draw);
}