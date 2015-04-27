var	vertexShaderSource, 
	fragmentShaderSource,
	vertexShader,
	fragmentShader,
	shaderProgram,
	canvas,
	gl,
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

function cubo(posicaoInicial, cores, tamanho, eixoRotacao, velocidade, camada)
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
		"eixo": eixoRotacao,
		"model": mat4.create(),
		"velocidade": velocidade,
		"camada": camada,
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
	
	window.addEventListener("mousedown", segurarMouse);
	window.addEventListener("mouseup", soltarMouse);	
}

function controiCubao()
{
	var tamanhoCubo = 2; //TAMANHO DAS FACES DO CUBO
	var tamanhoCubao = tamanhoCubo * 2;
	var espacamento = 0.03;
	var posicaoInicialCubo = [0, 0, 0]; //PONTO SUPERIOR ESQUERDO DO NOVO CUBO
	var coresCubo = controiCoresCubo(); //SEIS CORES DO CUBIBNHO
	var eixoRotacao = [[0, 1, 0], [1, 0, 0]]; //OS DOIS EIXOS DE ROTACAO DO CUBO
	var velocidade = 0.5; //velicidade da rotacao
	data = new Array();
	
	//CONTROI OS SEIS CUBOS DO CENTRO
	
	//FRENTE
	data[0] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, 4); //parametro camada = quadrante que o cubo esta
	
	//FUNDO
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[2] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, 4);
	
	//DIREITA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[1] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, 7);
	
	//ESQUERDA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[3] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, 1);
	
	//CIMA
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[4] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, 3);
	
	//BAIXO
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[5] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, 5);
	
	
	//CONTROI OS 12 CUBOS DOS CANTOS DUPLOS
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//DIREITA DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	data[6] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//ESQUERDA DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	data[7] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//CIMA DA FRENTE
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	data[8] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "superior");
	
	
	//BAIXO DA FRENTE
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	data[9] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "inferior");
	
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//DIREITA DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[10] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//ESQUERDA DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[11] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//CIMA DA TRAS
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = tamanhoCubo + espacamento;
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[12] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "superior");
	
	
	//BAIXO DA TRAS
	posicaoInicialCubo[0] = (espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[13] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "inferior");
	
	
	//BAIXO DA DIREITA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[14] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//CIMA DA DIREITA
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[15] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//BAIXO DA ESQUERDA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[16] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "superior");
	
	
	//CIMA DA ESQUERDA
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubo + espacamento;
	data[17] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "inferior");
	
	//CONTRÓI OS 8 CUBOS COM CANTOS TRIPLHOS
	
	posicaoInicialCubo = [0, 0, 0]; //LIMPA PONTOS
	
	//DIREITA SUPERIOR DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	data[18] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//ESQUERDA SUPERIOR DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	data[19] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//DIREITA INFERIOR DA FRENTE
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	data[20] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[0], coresCubo[2], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "superior");
	
	
	//ESQUERDA INFERIOR DA FRENTE
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	data[21] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[0], coresCubo[5], coresCubo[5], coresCubo[5]], tamanhoCubo, eixoRotacao, velocidade, "inferior");
	
	//DIREITA SUPERIOR DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[22] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//ESQUERDA SUPERIOR DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = (tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[23] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "centro");
	
	
	//DIREITA INFERIOR DA TRAS
	posicaoInicialCubo[0] = tamanhoCubo + espacamento;
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[24] = cubo(posicaoInicialCubo, [coresCubo[4], coresCubo[5], coresCubo[5], coresCubo[2], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "superior");
	
	
	//ESQUERDA INFERIOR DA TRAS
	posicaoInicialCubo[0] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[1] = -(tamanhoCubo + espacamento);
	posicaoInicialCubo[2] = tamanhoCubao + espacamento;
	data[25] = cubo(posicaoInicialCubo, [coresCubo[5], coresCubo[3], coresCubo[5], coresCubo[5], coresCubo[5], coresCubo[1]], tamanhoCubo, eixoRotacao, velocidade, "inferior");
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

function segurarMouse(e) 
{
	pressionado = true;
	botao = e.button;
	
	//se este a esquerda
	if (e.clientX <= (canvas.width/3))
	{
		quadrante = 0;
	}
	//se este no centro
	else if (e.clientX <= (canvas.width/2))
	{
		quadrante = 3;
	}
	//se esta a direita
	else if (e.clientX <= (canvas.width))
	{
		quadrante = 6;
	}
	
	//se esta acima
	if (e.clientY <= (canvas.height/3))
	{
		quadrante += 1;
	}
	//se esta a no centro
	else if (e.clientY <= (canvas.height/2))
	{
		quadrante += 2;
	}
	//se esta abaixo
	else if (e.clientY <= (canvas.height))
	{
		quadrante += 3;
	}
}

function rotacoes()
{
	//se apertou o mouse
	if (pressionado) 
	{
		if (botao == 0)
		{
			for (var i = 0; i < data.length; i++)
			{
				data[i].model = mat4.rotate([], data[i].model, (data[i].velocidade * Math.PI) / 180, data[i].eixo[1]); //rotaciona o cubo em X
			}
		}
		else if (botao == 1)
		{
			for (var i = 0; i < data.length; i++)
			{
				data[i].model = mat4.rotate([], data[i].model, (data[i].velocidade * Math.PI) / 180, data[i].eixo[0]); //rotaciona o cubo em Y
			}
		}
	}
}

function soltarMouse(e) 
{
	pressionado = false;
}

function draw()
{
	if (!camera) 
		camera = [10, 10, -20];
		
	//para cada cubo
	for (var i = 0; i < data.length; i++)
	{
		rotacoes();
		
		gl.uniformMatrix4fv(modelLocation, false, new Float32Array(data[i].model));
	
		//ATRIBUTOS DOS SHADERS
		positionAttr = gl.getAttribLocation(shaderProgram, "position");
		positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data[i].points, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(positionAttr);
		gl.vertexAttribPointer(positionAttr, 3, gl.FLOAT, false, 0, 0);
		
		colorAttr = gl.getAttribLocation(shaderProgram, "color");
		colorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, data[i].colors, gl.STATIC_DRAW);
		gl.enableVertexAttribArray(colorAttr);
		gl.vertexAttribPointer(colorAttr, 4, gl.FLOAT, false, 0, 0);
				
		gl.drawArrays(gl.TRIANGLES, 0, data[i].points.length/3);
	}
	
	
	requestAnimationFrame(draw);
}